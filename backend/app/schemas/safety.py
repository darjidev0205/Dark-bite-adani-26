
from pydantic import BaseModel, Field


class SafetyChecklistItem(BaseModel):
    id: str = Field(..., description="Unique checklist identifier")
    category: str = Field(..., description="Category: authentication, collect_request, qr, refund")
    title: str = Field(..., description="Short directive title")
    description: str = Field(..., description="Educational explanation")
    rule_type: str = Field(..., description="DO or DONT")
    severity: str = Field(default="critical", description="Importance level")


class SafetyChecklistResponse(BaseModel):
    version: str = Field(default="1.0.0", description="Safety guidelines version")
    last_updated: str = Field(..., description="Date of recommendation review")
    items: list[SafetyChecklistItem] = Field(default_factory=list)
