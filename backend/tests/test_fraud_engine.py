import pytest

from app.schemas.scan import ScanAnalyzeRequest
from app.services.fraud_engine import FraudDetectionEngine


@pytest.fixture
def fraud_engine() -> FraudDetectionEngine:
    return FraudDetectionEngine()


def test_normal_payment_message(fraud_engine: FraudDetectionEngine):
    """
    Normal peer-to-peer split message should have low risk score and no threat signals.
    """
    req = ScanAnalyzeRequest(
        input_type="message",
        message="Hey Rohan, sending Rs 450 for yesterday's dinner bill split.",
        amount=450.0,
    )
    score, level, signals, action = fraud_engine.analyze(req)

    assert score == 0
    assert level == "low"
    assert len(signals) == 0
    assert "No high-risk indicators" in action


def test_fake_reward_with_pin_request(fraud_engine: FraudDetectionEngine):
    """
    Fake reward/lottery message asking for UPI PIN must trigger PIN_REQUEST_RECEIVE and high risk.
    """
    req = ScanAnalyzeRequest(
        input_type="message",
        message="Congratulations! You have won Rs 5000 cashback. Enter your UPI PIN to claim reward now.",
        amount=5000.0,
    )
    score, level, signals, action = fraud_engine.analyze(req)

    assert level == "high"
    assert score >= 50
    signal_codes = [s.code for s in signals]
    assert "PIN_REQUEST_RECEIVE" in signal_codes
    assert "REWARD_REFUND_BAIT" in signal_codes
    assert "Do not enter your UPI PIN" in action


def test_kyc_urgency_with_otp_demand(fraud_engine: FraudDetectionEngine):
    """
    Urgent threat demanding OTP must trigger CREDENTIAL_OR_OTP_DEMAND and URGENCY_COERCION.
    """
    req = ScanAnalyzeRequest(
        input_type="message",
        message="URGENT: Your bank account will be blocked within 2 hours due to pending KYC. Share OTP immediately to verify.",
    )
    score, level, signals, action = fraud_engine.analyze(req)

    assert level == "high"
    assert score >= 50
    signal_codes = [s.code for s in signals]
    assert "CREDENTIAL_OR_OTP_DEMAND" in signal_codes
    assert "URGENCY_COERCION" in signal_codes
    assert "Never share your OTP" in action


def test_unknown_recipient_advisory(fraud_engine: FraudDetectionEngine):
    """
    Unknown recipient should trigger UNVERIFIED_RECIPIENT (+15) with low/medium advisory risk,
    not automatically marked as fraud.
    """
    req = ScanAnalyzeRequest(
        input_type="recipient",
        recipient_name="random_merchant_987",
    )
    score, level, signals, action = fraud_engine.analyze(req)

    assert score == 15
    assert level == "low"
    assert len(signals) == 1
    assert signals[0].code == "UNVERIFIED_RECIPIENT"
    assert signals[0].severity == "low"


def test_impersonation_recipient_keywords(fraud_engine: FraudDetectionEngine):
    """
    Recipient names containing suspicious keywords like 'support' or 'helpdesk' trigger warnings.
    """
    req = ScanAnalyzeRequest(
        input_type="recipient",
        recipient_name="SBI Bank Customer Support Official",
    )
    score, level, signals, action = fraud_engine.analyze(req)

    assert score == 15
    signal_codes = [s.code for s in signals]
    assert "SUSPICIOUS_RECIPIENT_KEYWORDS" in signal_codes


def test_score_capping_and_deduplication(fraud_engine: FraudDetectionEngine):
    """
    Combining multiple extreme scam indicators must cap risk score at 100
    and deduplicate repetitive trigger codes.
    """
    req = ScanAnalyzeRequest(
        input_type="message",
        message=(
            "URGENT: Enter your UPI PIN to claim lottery prize of Rs 50,000 immediately! "
            "Put your UPI PIN now. Share your OTP and password before account blocked. "
            "Visit http://gpay-claim-reward.xyz/login.apk now!"
        ),
        amount=50000.0,
    )
    score, level, signals, action = fraud_engine.analyze(req)

    assert score == 100  # Capped at 100
    assert level == "high"

    # Verify signal code uniqueness (deduplication)
    codes = [s.code for s in signals]
    assert len(codes) == len(set(codes))
    assert "PIN_REQUEST_RECEIVE" in codes
    assert "CREDENTIAL_OR_OTP_DEMAND" in codes
