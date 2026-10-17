from datetime import UTC, datetime

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.scan import RiskLevel, ScanListResponse, ScanResponse, ScanSignal
from app.security.validation import generate_minimized_summary, is_valid_object_id
from app.services.fraud_engine import FraudEngineRuleConfig


class ScanService:
    """
    Handles MongoDB scan persistence, user-scoped querying, and strict data minimization.
    Ensures zero cross-user data leakage and minimizes persistent user input.
    """

    @staticmethod
    async def create_scan_record(
        db: AsyncIOMotorDatabase,
        user_uid: str,
        input_type: str,
        risk_score: int,
        risk_level: RiskLevel,
        signals: list[ScanSignal],
        recommended_action: str,
        message: str | None = None,
        url: str | None = None,
        recipient_name: str | None = None,
        amount: float | None = None,
    ) -> ScanResponse:
        now_dt = datetime.now(UTC)
        iso_created_at = now_dt.isoformat()

        # Generate privacy-preserving summary instead of storing raw user input
        minimized_summary = generate_minimized_summary(
            input_type=input_type,
            message=message,
            url=url,
            recipient_name=recipient_name,
            amount=amount,
        )

        doc = {
            "user_uid": user_uid,
            "input_type": input_type,
            "input_summary": minimized_summary,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "signals": [s.model_dump() for s in signals],
            "recommended_action": recommended_action,
            "created_at": now_dt,
            "analysis_version": FraudEngineRuleConfig.VERSION,
        }

        result = await db.scans.insert_one(doc)
        scan_id = str(result.inserted_id)

        return ScanResponse(
            scan_id=scan_id,
            risk_score=risk_score,
            risk_level=risk_level,
            signals=signals,
            recommended_action=recommended_action,
            created_at=iso_created_at,
            disclaimer="This heuristic assessment cannot guarantee that a request is safe.",
        )

    @staticmethod
    async def get_user_scan(
        db: AsyncIOMotorDatabase,
        scan_id: str,
        user_uid: str,
    ) -> ScanResponse | None:
        """
        Retrieves a single scan document, strictly scoped to user_uid.
        Returns None if not found or if the scan belongs to another user.
        """
        if not is_valid_object_id(scan_id):
            return None

        doc = await db.scans.find_one({"_id": ObjectId(scan_id), "user_uid": user_uid})
        if not doc:
            return None

        return ScanService._doc_to_response(doc)

    @staticmethod
    async def list_user_scans(
        db: AsyncIOMotorDatabase,
        user_uid: str,
        page: int = 1,
        page_size: int = 20,
        risk_level: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> ScanListResponse:
        """
        Paginated scan history query strictly scoped to authenticated user_uid.
        Supports filtering by risk_level and date range.
        """
        query: dict = {"user_uid": user_uid}

        if risk_level and risk_level in ("low", "medium", "high"):
            query["risk_level"] = risk_level

        if start_date or end_date:
            date_filter: dict = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query["created_at"] = date_filter

        # Enforce bounds on pagination
        safe_page = max(1, page)
        safe_limit = min(max(1, page_size), 100)
        skip = (safe_page - 1) * safe_limit

        total = await db.scans.count_documents(query)
        cursor = db.scans.find(query).sort("created_at", -1).skip(skip).limit(safe_limit)
        items = []

        async for doc in cursor:
            items.append(ScanService._doc_to_response(doc))

        total_pages = (total + safe_limit - 1) // safe_limit if total > 0 else 0

        return ScanListResponse(
            items=items,
            total=total,
            page=safe_page,
            page_size=safe_limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def delete_user_scan(
        db: AsyncIOMotorDatabase,
        scan_id: str,
        user_uid: str,
    ) -> bool:
        """
        Deletes a scan document strictly scoped to user_uid.
        Returns True if deleted, False if not found or unauthorized.
        """
        if not is_valid_object_id(scan_id):
            return False

        result = await db.scans.delete_one({"_id": ObjectId(scan_id), "user_uid": user_uid})
        return result.deleted_count > 0

    @staticmethod
    def _doc_to_response(doc: dict) -> ScanResponse:
        created = doc.get("created_at")
        if isinstance(created, datetime):
            iso_str = created.isoformat()
        elif isinstance(created, str):
            iso_str = created
        else:
            iso_str = datetime.now(UTC).isoformat()

        signals_raw = doc.get("signals", [])
        signals = [ScanSignal(**s) for s in signals_raw]

        return ScanResponse(
            scan_id=str(doc["_id"]),
            risk_score=doc.get("risk_score", 0),
            risk_level=doc.get("risk_level", "low"),
            signals=signals,
            recommended_action=doc.get("recommended_action", ""),
            created_at=iso_str,
            disclaimer="This heuristic assessment cannot guarantee that a request is safe.",
        )
