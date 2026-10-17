from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.firebase import get_current_user
from app.database import get_database
from app.schemas.scan import (
    ScanAnalyzeRequest,
    ScanListResponse,
    ScanResponse,
)
from app.security.limits import check_rate_limit
from app.services.fraud_engine import FraudDetectionEngine
from app.services.scan_service import ScanService

router = APIRouter(prefix="/scans", tags=["Scans & Fraud Analysis"])

# Singleton fraud engine instance
_fraud_engine = FraudDetectionEngine()


@router.post("/analyze", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def analyze_scan(
    request_data: ScanAnalyzeRequest,
    req: Request,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Analyzes payment text, URLs, or recipient identities against deterministic fraud heuristics.
    Persists a minimized record and returns structured warning signals and recommended actions.
    """
    user_uid = current_user["uid"]

    # Enforce rate limit per authenticated user
    check_rate_limit(req, user_uid=user_uid)

    # Execute deterministic heuristic analysis
    risk_score, risk_level, signals, recommended_action = _fraud_engine.analyze(request_data)

    # Persist minimized scan record (zero raw payment credential persistence)
    scan_record = await ScanService.create_scan_record(
        db=db,
        user_uid=user_uid,
        input_type=request_data.input_type,
        risk_score=risk_score,
        risk_level=risk_level,
        signals=signals,
        recommended_action=recommended_action,
        message=request_data.message,
        url=request_data.url,
        recipient_name=request_data.recipient_name,
        amount=request_data.amount,
    )

    return scan_record


@router.get("", response_model=ScanListResponse)
async def list_scans(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    risk_level: str | None = Query(None, pattern="^(low|medium|high)$", description="Filter by risk level"),
    start_date: datetime | None = Query(None, description="Filter scans created on or after UTC datetime"),
    end_date: datetime | None = Query(None, description="Filter scans created on or before UTC datetime"),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns bounded, paginated scan history strictly scoped to the authenticated user.
    """
    user_uid = current_user["uid"]
    return await ScanService.list_user_scans(
        db=db,
        user_uid=user_uid,
        page=page,
        page_size=page_size,
        risk_level=risk_level,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Retrieves a single scan assessment only if it belongs to the authenticated user.
    Returns HTTP 404 for invalid IDs, non-existent records, or scans belonging to other users.
    """
    user_uid = current_user["uid"]
    scan = await ScanService.get_user_scan(db=db, scan_id=scan_id, user_uid=user_uid)

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID '{scan_id}' not found.",
        )

    return scan


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(
    scan_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Deletes a scan assessment only if it belongs to the authenticated user.
    Returns HTTP 404 for non-existent or inaccessible scans.
    """
    user_uid = current_user["uid"]
    deleted = await ScanService.delete_user_scan(db=db, scan_id=scan_id, user_uid=user_uid)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID '{scan_id}' not found.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
