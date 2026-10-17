from fastapi import APIRouter

from app.schemas.safety import SafetyChecklistItem, SafetyChecklistResponse

router = APIRouter(prefix="/safety", tags=["Safety Checklist"])

# Curated, server-owned UPI safety directives
CURATED_CHECKLIST = [
    SafetyChecklistItem(
        id="CHK-PIN-01",
        category="authentication",
        title="Never enter UPI PIN to receive money",
        description="A UPI PIN is used exclusively to authorize money leaving your account. You NEVER need to enter your PIN to receive a payment or refund.",
        rule_type="DONT",
        severity="critical",
    ),
    SafetyChecklistItem(
        id="CHK-OTP-02",
        category="authentication",
        title="Keep OTPs confidential",
        description="One-time passwords sent to your phone are personal security keys. Bank staff, app customer support, and merchants never ask for OTPs.",
        rule_type="DONT",
        severity="critical",
    ),
    SafetyChecklistItem(
        id="CHK-COL-03",
        category="collect_request",
        title="Scrutinize incoming collect requests",
        description="Fraudsters send 'Collect' or 'Debit' requests pretending to send refunds or reward money. Tapping approve initiates a transfer from your bank account.",
        rule_type="DO",
        severity="high",
    ),
    SafetyChecklistItem(
        id="CHK-QR-04",
        category="qr",
        title="Scanning a QR code always sends money",
        description="Scanning a QR code inside a UPI app is strictly a payment initiation action. No valid QR scan can deposit money into your account.",
        rule_type="DONT",
        severity="critical",
    ),
    SafetyChecklistItem(
        id="CHK-SCR-05",
        category="refund",
        title="Never install screen-sharing software",
        description="Scammers ask users to install apps like AnyDesk, TeamViewer, or QuickSupport to 'resolve KYC' or 'process refunds'. These grant full remote control over your phone.",
        rule_type="DONT",
        severity="critical",
    ),
    SafetyChecklistItem(
        id="CHK-VPA-06",
        category="verification",
        title="Verify recipient name on the bank confirmation screen",
        description="Before typing your PIN, inspect the name displayed on the NPCI UPI screen. Confirm it matches the intended beneficiary and not an arbitrary individual.",
        rule_type="DO",
        severity="high",
    ),
]


@router.get("/checklist", response_model=SafetyChecklistResponse)
async def get_safety_checklist():
    """
    Returns curated, authoritative UPI security guidelines and defensive checklists.
    """
    return SafetyChecklistResponse(
        version="1.0.0",
        last_updated="2026-10-17",
        items=CURATED_CHECKLIST,
    )
