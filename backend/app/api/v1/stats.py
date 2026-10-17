from typing import Any

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.firebase import get_current_user
from app.database import get_database
from app.schemas.stats import StatsOverviewResponse
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])


@router.get("/overview", response_model=StatsOverviewResponse)
async def get_stats_overview(
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns aggregate counts of the authenticated user's scans, grouped by risk level,
    along with recent activity.
    Clearly labeled as detected-risk statistics, not confirmed fraud.
    """
    user_uid = current_user["uid"]
    return await StatsService.get_user_overview(db=db, user_uid=user_uid)
