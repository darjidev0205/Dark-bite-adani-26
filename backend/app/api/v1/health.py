from datetime import UTC, datetime

from fastapi import APIRouter

from app.database import check_db_health

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """
    Returns high-level service and database connectivity status.
    Strictly avoids exposing internal infrastructure, database credentials, or secret configuration.
    """
    db_ok = await check_db_health()

    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.now(UTC).isoformat(),
        "database": "connected" if db_ok else "unreachable",
        "service": "upi-shield-backend",
        "version": "1.0.0",
    }
