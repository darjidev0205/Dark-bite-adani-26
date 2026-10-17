from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.stats import StatsOverviewResponse
from app.services.scan_service import ScanService


class StatsService:
    """
    Computes aggregated risk summaries for dashboard presentation.
    Explicitly frames metrics as detected-risk indicators rather than confirmed fraud.
    """

    @staticmethod
    async def get_user_overview(db: AsyncIOMotorDatabase, user_uid: str) -> StatsOverviewResponse:
        # Aggregation pipeline scoped to user_uid
        pipeline = [
            {"$match": {"user_uid": user_uid}},
            {
                "$group": {
                    "_id": "$risk_level",
                    "count": {"$sum": 1},
                }
            },
        ]

        cursor = db.scans.aggregate(pipeline)
        counts = {"low": 0, "medium": 0, "high": 0}
        async for doc in cursor:
            level = doc["_id"]
            if level in counts:
                counts[level] = doc["count"]

        total = sum(counts.values())
        high_risk_pct = round((counts["high"] / total * 100), 1) if total > 0 else 0.0

        # Fetch 5 most recent scans for the dashboard summary
        recent_cursor = db.scans.find({"user_uid": user_uid}).sort("created_at", -1).limit(5)
        recent_items = []
        async for doc in recent_cursor:
            recent_items.append(ScanService._doc_to_response(doc))

        return StatsOverviewResponse(
            total_scans=total,
            low_risk_count=counts["low"],
            medium_risk_count=counts["medium"],
            high_risk_count=counts["high"],
            high_risk_percentage=high_risk_pct,
            recent_scans=recent_items,
            metric_label="Detected-risk indicators (heuristic warnings, not confirmed fraud adjudication)",
        )
