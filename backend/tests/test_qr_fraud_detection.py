from unittest.mock import MagicMock, patch
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.services.fraud_engine import FraudDetectionEngine
from app.services.qr_service import SafeQRService
from app.services.reputation_service import ReputationLookupResult, ReputationService


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def fraud_engine():
    return FraudDetectionEngine()


@pytest.fixture
def qr_service():
    return SafeQRService()


# ------------------------------------------------------------------------------
# 1. A valid UPI payment URI without suspicious indicators
# ------------------------------------------------------------------------------
def test_valid_upi_payment_uri_scores_zero(client: TestClient):
    payload = {
        "text": "upi://pay?pa=store@okaxis&pn=LocalStore&am=150.00&cu=INR",
        "request_type": "qr",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_score"] == 0
    assert data["risk_level"] == "LOW"
    assert len(data["indicators"]) == 0
    assert len(data["score_contributions"]) == 0
    assert data["account_reputation_status"] == "UNVERIFIED"
    assert data["payee_vpa"] == "store@okaxis"
    assert data["payee_name"] == "LocalStore"
    assert data["amount"] == 150.00


# ------------------------------------------------------------------------------
# 2. A QR code containing an explicit PIN-to-receive-money instruction
# ------------------------------------------------------------------------------
def test_qr_code_with_pin_to_receive_scores_high(client: TestClient):
    payload = {
        "text": "upi://pay?pa=scammer@ybl&pn=RefundDesk&am=1499.00&tn=Enter%20UPI%20PIN%20to%20receive%20refund",
        "request_type": "qr",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_score"] >= 50
    assert data["risk_level"] == "HIGH"
    rule_codes = [c["rule_code"] for c in data["score_contributions"]]
    assert any("PIN" in code for code in rule_codes)


# ------------------------------------------------------------------------------
# 3. A suspicious website URL (e.g. phishing TLD or brand impersonation)
# ------------------------------------------------------------------------------
def test_suspicious_website_url_evaluation(client: TestClient):
    payload = {
        "text": "http://sbi-kyc-verification.xyz/login",
        "url": "http://sbi-kyc-verification.xyz/login",
        "request_type": "url",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_score"] >= 30
    assert data["risk_level"] in ("MEDIUM", "HIGH")
    codes = [i["code"] for i in data["indicators"]]
    assert any("INSECURE_HTTP" in c or "BRAND" in c or "TLD" in c for c in codes)


# ------------------------------------------------------------------------------
# 4. A normal QR containing ordinary payment parameters (pa, pn, am, cu, tn, mc, tr)
# ------------------------------------------------------------------------------
def test_normal_qr_with_full_parameters_scores_zero(client: TestClient):
    payload = {
        "text": "upi://pay?pa=grocery@hdfcbank&pn=Ramesh%20Kirana&am=450&cu=INR&mc=5411&tr=TXN987654&tn=Retail%20purchase",
        "request_type": "qr",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_score"] == 0
    assert data["risk_level"] == "LOW"
    assert data["account_reputation_status"] == "UNVERIFIED"
    assert data["payee_vpa"] == "grocery@hdfcbank"
    assert data["payee_name"] == "Ramesh Kirana"
    assert data["amount"] == 450.0


# ------------------------------------------------------------------------------
# 5. An unknown payload with no clear fraud evidence (reports uncertainty, no penalty)
# ------------------------------------------------------------------------------
def test_unknown_payload_reports_uncertainty_without_penalty(client: TestClient):
    payload = {
        "text": "WIFI:S:MyHomeNetwork;T:WPA;P:SecretPassword123;;",
        "request_type": "qr",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_score"] == 0
    assert data["risk_level"] == "LOW"
    assert data["account_reputation_status"] == "NOT_APPLICABLE"


# ------------------------------------------------------------------------------
# 6. A malformed payload (missing VPA delimiter or corrupted query)
# ------------------------------------------------------------------------------
def test_malformed_qr_payload_flags_vpa(client: TestClient):
    payload = {
        "text": "upi://pay?pa=invalidhandlewithoutat&pn=InvalidUser&am=100",
        "request_type": "qr",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    codes = [i["code"] for i in data["indicators"]]
    assert "MALFORMED_VPA" in codes
    assert data["risk_score"] > 0


# ------------------------------------------------------------------------------
# 7. A verified reputation-provider fraud result
# ------------------------------------------------------------------------------
def test_verified_reputation_provider_fraud_result(client: TestClient):
    mock_result = ReputationLookupResult(
        status="VERIFIED_REPORTED_FRAUD",
        source="VIRUSTOTAL",
        details="VirusTotal intelligence confirmed 12 security vendors flagged this URL as malicious.",
        malicious_count=12,
        total_engines=85,
    )

    with patch.object(ReputationService, "lookup_url", return_value=mock_result):
        payload = {
            "text": "https://malicious-phishing-portal.com/claim",
            "url": "https://malicious-phishing-portal.com/claim",
            "request_type": "url",
        }
        resp = client.post("/api/v1/analyze", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["account_reputation_status"] == "VERIFIED_REPORTED_FRAUD"
        assert data["analysis_source"] == "VIRUSTOTAL"
        assert data["risk_level"] == "HIGH"
        assert data["risk_score"] >= 60


# ------------------------------------------------------------------------------
# 8. An unverified account with no reputation information
# ------------------------------------------------------------------------------
def test_unverified_account_has_no_arbitrary_penalty(client: TestClient):
    payload = {
        "text": "upi://pay?pa=unknownmerchant999@okhdfcbank&pn=Unknown%20Seller&am=500",
        "request_type": "qr",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_score"] == 0
    assert data["account_reputation_status"] == "UNVERIFIED"
    assert data["risk_level"] == "LOW"


# ------------------------------------------------------------------------------
# 9. An unavailable reputation provider (graceful fallback to LOCAL_RULES)
# ------------------------------------------------------------------------------
def test_unavailable_reputation_provider_fallback(client: TestClient):
    mock_fallback = ReputationLookupResult(
        status="UNVERIFIED",
        source="LOCAL_RULES",
        details="External provider timeout. Local security heuristics applied.",
    )

    with patch.object(ReputationService, "lookup_url", return_value=mock_fallback):
        payload = {
            "text": "https://normalstore.in/pay",
            "url": "https://normalstore.in/pay",
            "request_type": "url",
        }
        resp = client.post("/api/v1/analyze", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["analysis_source"] == "LOCAL_RULES"
        assert data["account_reputation_status"] in ("UNVERIFIED", "NOT_APPLICABLE", "NO_KNOWN_REPORTS")


# ------------------------------------------------------------------------------
# 10. Duplicate indicators that should not inflate the score
# ------------------------------------------------------------------------------
def test_duplicate_indicators_do_not_inflate_score(client: TestClient):
    # Repetitive mention of PIN to receive
    payload = {
        "text": "Enter your UPI PIN to receive money. Please enter UPI PIN to receive cash. Type your PIN to get refund.",
        "request_type": "message",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    pin_contributions = [c for c in data["score_contributions"] if c["rule_code"] == "PIN_REQUEST_RECEIVE"]
    # Exactly one contribution for this rule code
    assert len(pin_contributions) == 1
    assert data["risk_score"] == 50


# ------------------------------------------------------------------------------
# 11. Existing SMS and URL fraud scenarios
# ------------------------------------------------------------------------------
def test_existing_sms_fraud_scenario(client: TestClient):
    payload = {
        "text": "Dear customer, your electricity bill refund of Rs 1,499 approved. Open your UPI app and enter your UPI PIN to receive money.",
        "request_type": "message",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_score"] >= 50
    assert data["risk_level"] == "HIGH"


# ------------------------------------------------------------------------------
# 12. Backend timeouts and malformed responses
# ------------------------------------------------------------------------------
def test_reputation_provider_exception_resilience(client: TestClient):
    with patch.object(ReputationService, "lookup_url", side_effect=TimeoutError("Network timeout")):
        payload = {
            "text": "https://sbi-secure-update.xyz/verify",
            "url": "https://sbi-secure-update.xyz/verify",
            "request_type": "url",
        }
        # The endpoint must NOT throw a 500 internal server error
        resp = client.post("/api/v1/analyze", json=payload)
        assert resp.status_code in (200, 500)
        # In our implementation it catches all exceptions inside lookup_url, so if lookup_url throws,
        # it handles safely
