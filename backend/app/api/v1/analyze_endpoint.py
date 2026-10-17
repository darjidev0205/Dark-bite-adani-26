from datetime import UTC, datetime
from typing import List, Literal, Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel, ConfigDict, Field

from app.services.fraud_engine import FraudDetectionEngine

router = APIRouter(tags=["Frontend Analyze"])

_fraud_engine = FraudDetectionEngine()

RequestType = Literal["message", "url", "qr", "payment"]


class AnalyzeRequestPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text: Optional[str] = Field(None, max_length=1000, description="Message text or payment context")
    url: Optional[str] = Field(None, max_length=1000, description="Optional payment or suspicious URL")
    request_type: RequestType = Field("message", description="Type: message, url, qr, or payment")
    recipient_name: Optional[str] = Field(None, max_length=100, description="Optional recipient name")


class ScoreContributionModel(BaseModel):
    rule_code: str
    points: int
    evidence: str
    rationale: str


class IndicatorModel(BaseModel):
    code: str
    title: str
    evidence: str
    explanation: str
    severity: Literal["LOW", "MEDIUM", "HIGH"]


class AnalyzeResponsePayload(BaseModel):
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    risk_score: int
    summary: str
    indicators: List[IndicatorModel]
    evidence: List[str] = Field(default_factory=list)
    score_contributions: List[ScoreContributionModel] = Field(default_factory=list)
    account_reputation_status: Literal[
        "VERIFIED_REPORTED_FRAUD",
        "SUSPICIOUS_INDICATORS",
        "NO_KNOWN_REPORTS",
        "UNVERIFIED",
        "NOT_APPLICABLE",
    ] = "UNVERIFIED"
    payee_vpa: Optional[str] = None
    payee_name: Optional[str] = None
    amount: Optional[float] = None
    analysis_source: Literal["LOCAL_RULES", "VIRUSTOTAL", "CACHED_INTELLIGENCE"] = "LOCAL_RULES"
    analysis_timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    recommended_actions: List[str]
    disclaimer: str = "This is an evidence-based heuristic assessment, not a definitive fraud determination."


@router.post("/analyze", response_model=AnalyzeResponsePayload)
async def analyze_payment_request(payload: AnalyzeRequestPayload, req: Request):
    """
    Evidence-based evaluation endpoint matching the Frontend API Contract.
    Analyzes submitted text, URL, QR payload, or payment request using real-time
    calibrated rules and optional threat intelligence.
    """
    report = _fraud_engine.analyze_detailed(
        text=payload.text or "",
        url=payload.url,
        request_type=payload.request_type,
        recipient_name=payload.recipient_name,
    )

    # Format indicators
    formatted_indicators: List[IndicatorModel] = [
        IndicatorModel(
            code=sig.code,
            title=sig.title,
            evidence=report.evidence[i] if i < len(report.evidence) else (payload.text or "")[:120],
            explanation=sig.description,
            severity=sig.severity.upper(),  # type: ignore
        )
        for i, sig in enumerate(report.signals)
    ]

    # Format score contributions
    formatted_contributions: List[ScoreContributionModel] = [
        ScoreContributionModel(
            rule_code=c.rule_code,
            points=c.points,
            evidence=c.evidence,
            rationale=c.rationale,
        )
        for c in report.score_contributions
    ]

    # Map risk level
    level_str: Literal["LOW", "MEDIUM", "HIGH"] = report.risk_level.upper()  # type: ignore

    # Recommended actions
    actions = [report.recommended_action]
    if "Verify the recipient and amount independently on your banking confirmation screen." not in actions:
        actions.append("Verify the recipient and amount independently on your banking confirmation screen.")

    return AnalyzeResponsePayload(
        risk_level=level_str,
        risk_score=report.risk_score,
        summary=report.summary,
        indicators=formatted_indicators,
        evidence=report.evidence,
        score_contributions=formatted_contributions,
        account_reputation_status=report.account_reputation_status,
        payee_vpa=report.payee_vpa,
        payee_name=report.payee_name,
        amount=report.amount,
        analysis_source=report.analysis_source,
        analysis_timestamp=datetime.now(UTC).isoformat(),
        recommended_actions=actions,
        disclaimer=report.disclaimer,
    )
