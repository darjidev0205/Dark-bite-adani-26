from fastapi import APIRouter

from app.api.v1.analyze_endpoint import router as analyze_router
from app.api.v1.health import router as health_router
from app.api.v1.me import router as me_router
from app.api.v1.safety import router as safety_router
from app.api.v1.scans import router as scans_router
from app.api.v1.stats import router as stats_router

api_v1_router = APIRouter(prefix="/api/v1")

# Mount endpoints
api_v1_router.include_router(analyze_router)
api_v1_router.include_router(health_router)
api_v1_router.include_router(me_router)
api_v1_router.include_router(scans_router)
api_v1_router.include_router(stats_router)
api_v1_router.include_router(safety_router)
