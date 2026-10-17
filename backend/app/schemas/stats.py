
from pydantic import BaseModel, Field

from app.schemas.scan import ScanResponse


class StatsOverviewResponse(BaseModel):
    """
    Dashboard statistics schema.
    Explicitly labeled as detected-risk statistics, not confirmed fraud.
    """
    total_scans: int = Field(default=0, description="Total scans initiated by the user")
    low_risk_count: int = Field(default=0, description="Scans categorized as low risk (0-19)")
    medium_risk_count: int = Field(default=0, description="Scans categorized as medium risk (20-49)")
    high_risk_count: int = Field(default=0, description="Scans categorized as high risk (50-100)")
    high_risk_percentage: float = Field(default=0.0, description="Percentage of scans with high detected warning signs")
    recent_scans: list[ScanResponse] = Field(default_factory=list, description="Recent 5 scan assessments")
    metric_label: str = Field(
        default="Detected-risk indicators (heuristic warnings, not confirmed fraud adjudication)",
        description="Clear regulatory disclaimer that metrics reflect warning signals",
    )
