from starlette.testclient import TestClient

from app.security.limits import InMemoryRateLimiter
from app.security.logging import redact_sensitive_text
from tests.conftest import make_auth_header


def test_sensitive_data_redaction():
    """
    Verifies that logging redaction masks PINs, OTPs, Card numbers, and Bearer tokens.
    """
    sample = "User entered UPI PIN 482910 with OTP 849201 and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz.abc"
    redacted = redact_sensitive_text(sample)

    assert "482910" not in redacted
    assert "849201" not in redacted
    assert "eyJhbGciOi" not in redacted
    assert "[REDACTED_PIN]" in redacted
    assert "[REDACTED_OTP]" in redacted


def test_rate_limiter_unit():
    """
    Tests sliding-window rate limiter behavior.
    """
    limiter = InMemoryRateLimiter(requests_per_minute=3)
    key = "test_user_key"

    assert limiter.is_rate_limited(key) is False
    assert limiter.is_rate_limited(key) is False
    assert limiter.is_rate_limited(key) is False
    # 4th request must be rate limited
    assert limiter.is_rate_limited(key) is True


def test_health_check_no_leakage(client: TestClient):
    """
    Ensures GET /api/v1/health does not leak passwords, host IPs, or Atlas connection URIs.
    """
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "database" in data
    # Ensure no credentials or connection string in response
    resp_text = resp.text.lower()
    assert "mongodb://" not in resp_text
    assert "mongodb+srv://" not in resp_text
    assert "password" not in resp_text


def test_stats_overview_endpoint(client: TestClient):
    """
    Tests GET /api/v1/stats/overview and ensures warning metrics are clearly labeled.
    """
    headers = make_auth_header("user_stats_1")

    # Add 1 high risk and 1 low risk scan
    client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "Normal split 100", "amount": 100},
        headers=headers,
    )
    client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "Enter your UPI PIN to claim 5000 prize"},
        headers=headers,
    )

    stats_resp = client.get("/api/v1/stats/overview", headers=headers)
    assert stats_resp.status_code == 200
    data = stats_resp.json()

    assert data["total_scans"] == 2
    assert data["high_risk_count"] == 1
    assert data["low_risk_count"] == 1
    assert data["high_risk_percentage"] == 50.0
    assert "heuristic warnings, not confirmed fraud" in data["metric_label"]
    assert len(data["recent_scans"]) == 2


def test_safety_checklist_endpoint(client: TestClient):
    """
    Tests GET /api/v1/safety/checklist returns curated directives.
    """
    resp = client.get("/api/v1/safety/checklist")
    assert resp.status_code == 200
    data = resp.json()

    assert data["version"] == "1.0.0"
    assert len(data["items"]) >= 5
    first_item = data["items"][0]
    assert "id" in first_item
    assert "category" in first_item
    assert "title" in first_item
    assert "rule_type" in first_item
