from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.scan import ScanAnalyzeRequest
from app.services.fraud_engine import FraudDetectionEngine
from app.services.qr_service import SafeQRService

router = APIRouter(tags=["Frontend Analyze"])

_fraud_engine = FraudDetectionEngine()
_qr_service = SafeQRService()

RequestType = Literal["message", "url", "qr", "payment"]


class AnalyzeRequestPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text: Optional[str] = Field(None, max_length=1000, description="Message text or payment context")
    url: Optional[str] = Field(None, max_length=1000, description="Optional payment or suspicious URL")
    request_type: RequestType = Field("message", description="Type: message, url, qr, or payment")
    recipient_name: Optional[str] = Field(None, max_length=100, description="Optional recipient name")


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
    recommended_actions: List[str]
    disclaimer: str = "This is a heuristic assessment, not a definitive fraud determination."


@router.post("/analyze", response_model=AnalyzeResponsePayload)
async def analyze_payment_request(payload: AnalyzeRequestPayload, req: Request):
    """
    Direct evaluation endpoint matching the Frontend API Contract.
    Analyzes submitted text, URL, QR payload, or payment request using deterministic heuristics.
    """
    mapped_input_type = "message"
    if payload.request_type == "url":
        mapped_input_type = "url"
    elif payload.request_type in ("qr", "payment"):
        mapped_input_type = "message"

    # If QR type and text has upi:// format, run QR analyzer first
    qr_indicators: List[IndicatorModel] = []
    if payload.request_type == "qr" and payload.text:
        qr_res = _qr_service.analyze_upi_uri(payload.text)
        for s in qr_res.signals:
            qr_indicators.append(
                IndicatorModel(
                    code=s["code"],
                    title=s["title"],
                    evidence=payload.text[:80],
                    explanation=s["description"],
                    severity=s["severity"].upper(),  # type: ignore
                )
            )

    scan_req = ScanAnalyzeRequest(
        input_type=mapped_input_type,  # type: ignore
        message=payload.text if mapped_input_type == "message" else (payload.text or "Analyzing submitted link"),
        url=payload.url if payload.url else (payload.text if payload.request_type == "url" else None),
        recipient_name=payload.recipient_name,
        amount=None,
    )

    risk_score, risk_level, signals, recommended_action = _fraud_engine.analyze(scan_req)

    # Format indicators
    indicators: List[IndicatorModel] = []
    for sig in signals:
        evidence_text = ""
        if payload.text and any(w in payload.text.lower() for w in ["pin", "otp", "refund", "block", "urgent"]):
            evidence_text = payload.text
        elif payload.url:
            evidence_text = payload.url
        elif payload.recipient_name:
            evidence_text = payload.recipient_name
        else:
            evidence_text = payload.text or "Detected in request structure"

        indicators.append(
            IndicatorModel(
                code=sig.code,
                title=sig.title,
                evidence=evidence_text[:120],
                explanation=sig.description,
                severity=sig.severity.upper(),  # type: ignore
            )
        )

    # Merge any specific QR signals
    for q in qr_indicators:
        if not any(i.code == q.code for i in indicators):
            indicators.append(q)
            risk_score = min(100, risk_score + 25)

    # Adjust risk level if QR pushed score up
    if risk_score >= 50:
        level_str: Literal["LOW", "MEDIUM", "HIGH"] = "HIGH"
    elif risk_score >= 20:
        level_str = "MEDIUM"
    else:
        level_str = "LOW"

    # Formulate summary
    if level_str == "HIGH":
        summary = "This request contains high-risk indicators commonly associated with UPI payment fraud or social engineering."
    elif level_str == "MEDIUM":
        summary = "This request exhibits suspicious warning signs. Exercise caution before approving or entering credentials."
    else:
        summary = "No obvious warning signs detected based on heuristic checks. Always confirm recipient name before paying."

    # Recommended actions list
    actions = [recommended_action]
    if "Verify the request independently." not in actions:
        actions.append("Verify the recipient and amount independently on your banking confirmation screen.")

    return AnalyzeResponsePayload(
        risk_level=level_str,
        risk_score=risk_score,
        summary=summary,
        indicators=indicators,
        recommended_actions=actions,
        disclaimer="This is a heuristic assessment, not a definitive fraud determination.",
    )
