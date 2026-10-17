from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

RiskLevel = Literal["low", "medium", "high"]
InputType = Literal["message", "url", "recipient"]
SignalSeverity = Literal["low", "medium", "high"]


class ScanSignal(BaseModel):
    """
    Structured detection signal explaining a specific warning factor.
    """
    model_config = ConfigDict(extra="forbid")

    code: str = Field(..., description="Machine-readable unique signal code (e.g. PIN_REQUEST)")
    title: str = Field(..., description="Human-readable short title")
    description: str = Field(..., description="Clear explanation of the warning sign")
    severity: SignalSeverity = Field(..., description="Severity level: low, medium, or high")


class ScanAnalyzeRequest(BaseModel):
    """
    Exact analysis request schema according to API contract (Section 6).
    Rejects unexpected fields and enforces input bounds.
    """
    model_config = ConfigDict(extra="forbid")

    input_type: InputType = Field(..., description="Type of input: message, url, or recipient")
    message: str | None = Field(None, max_length=1000, description="Payment request message or SMS text")
    url: str | None = Field(None, max_length=1000, description="Submitted payment or collect URL")
    recipient_name: str | None = Field(None, max_length=100, description="Display name or VPA of recipient")
    amount: float | None = Field(
        None,
        gt=0,
        le=10_000_000,  # 1 Crore INR realistic upper ceiling for consumer UPI
        description="Optional positive numeric payment amount in INR",
    )

    @model_validator(mode="after")
    def validate_type_payload(self) -> "ScanAnalyzeRequest":
        if self.input_type == "message":
            if not self.message or not self.message.strip():
                raise ValueError("Field 'message' is required and cannot be empty when input_type is 'message'")
        elif self.input_type == "url":
            if not self.url or not self.url.strip():
                raise ValueError("Field 'url' is required and cannot be empty when input_type is 'url'")
        elif self.input_type == "recipient":
            if not self.recipient_name or not self.recipient_name.strip():
                raise ValueError("Field 'recipient_name' is required and cannot be empty when input_type is 'recipient'")
        return self


class ScanResponse(BaseModel):
    """
    Exact analysis response schema matching frontend contract (Section 7).
    """
    model_config = ConfigDict(extra="ignore")

    scan_id: str = Field(..., description="MongoDB document ID string")
    risk_score: int = Field(..., ge=0, le=100, description="Calculated risk score integer (0-100)")
    risk_level: RiskLevel = Field(..., description="Risk category: low, medium, or high")
    signals: list[ScanSignal] = Field(default_factory=list, description="List of detected risk signals")
    recommended_action: str = Field(..., description="Recommended defensive user action")
    created_at: str = Field(..., description="ISO 8601 UTC timestamp string")
    disclaimer: str = Field(
        default="This heuristic assessment cannot guarantee that a request is safe.",
        description="Disclaimer on heuristic boundaries",
    )


class ScanListResponse(BaseModel):
    """
    Paginated response for scan history list.
    """
    items: list[ScanResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
