from starlette.testclient import TestClient

from tests.conftest import make_auth_header


def test_analyze_message_scan_contract(client: TestClient):
    """
    Verifies that POST /api/v1/scans/analyze adheres exactly to the contract required by React frontend.
    """
    headers = make_auth_header("user_alpha")
    payload = {
        "input_type": "message",
        "message": "Urgent: enter your UPI PIN to receive a refund",
        "url": None,
        "recipient_name": "Example recipient",
        "amount": 500,
    }

    response = client.post("/api/v1/scans/analyze", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    # Contract validation: exact required keys
    assert "scan_id" in data
    assert isinstance(data["scan_id"], str)
    assert len(data["scan_id"]) == 24  # MongoDB ObjectId

    assert "risk_score" in data
    assert isinstance(data["risk_score"], int)
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_score"] >= 50

    assert data["risk_level"] == "high"

    assert "signals" in data
    assert isinstance(data["signals"], list)
    assert len(data["signals"]) > 0
    signal = data["signals"][0]
    assert "code" in signal
    assert "title" in signal
    assert "description" in signal
    assert "severity" in signal
    assert signal["severity"] in ("low", "medium", "high")

    assert "recommended_action" in data
    assert isinstance(data["recommended_action"], str)

    assert "created_at" in data
    assert isinstance(data["created_at"], str)

    assert "disclaimer" in data
    assert "heuristic" in data["disclaimer"].lower()


def test_analyze_validation_errors(client: TestClient):
    """
    Validates rejection of mismatched input_type, empty values, unexpected extra fields,
    and invalid amounts.
    """
    headers = make_auth_header("user_alpha")

    # 1. input_type is 'message' but message is empty
    resp1 = client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "   "},
        headers=headers,
    )
    assert resp1.status_code == 422

    # 2. Unexpected extra field rejected (extra='forbid')
    resp2 = client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "hello", "unexpected_field": "exploit"},
        headers=headers,
    )
    assert resp2.status_code == 422

    # 3. Negative amount
    resp3 = client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "hello", "amount": -50},
        headers=headers,
    )
    assert resp3.status_code == 422


def test_list_and_filter_scans(client: TestClient):
    """
    Verifies user-scoped scan history listing, pagination, and risk_level filtering.
    """
    headers = make_auth_header("user_beta")

    # Insert a low risk scan
    client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "Dinner bill split 200", "amount": 200},
        headers=headers,
    )

    # Insert a high risk scan
    client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "Enter your UPI PIN to claim 1000 cashback"},
        headers=headers,
    )

    # List all
    list_resp = client.get("/api/v1/scans?page=1&page_size=10", headers=headers)
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] == 2
    assert len(list_data["items"]) == 2

    # Filter by risk_level=high
    filter_resp = client.get("/api/v1/scans?risk_level=high", headers=headers)
    assert filter_resp.status_code == 200
    filtered_data = filter_resp.json()
    assert filtered_data["total"] == 1
    assert filtered_data["items"][0]["risk_level"] == "high"


def test_cross_user_isolation(client: TestClient):
    """
    Security check: User B must never be able to view or delete User A's scans.
    """
    headers_user_a = make_auth_header("user_alice")
    headers_user_b = make_auth_header("user_bob")

    # User Alice creates a scan
    create_resp = client.post(
        "/api/v1/scans/analyze",
        json={"input_type": "message", "message": "Secret payment check"},
        headers=headers_user_a,
    )
    assert create_resp.status_code == 201
    scan_id = create_resp.json()["scan_id"]

    # User Alice can view her own scan
    alice_get = client.get(f"/api/v1/scans/{scan_id}", headers=headers_user_a)
    assert alice_get.status_code == 200

    # User Bob attempts to view Alice's scan -> 404
    bob_get = client.get(f"/api/v1/scans/{scan_id}", headers=headers_user_b)
    assert bob_get.status_code == 404

    # User Bob attempts to delete Alice's scan -> 404
    bob_del = client.delete(f"/api/v1/scans/{scan_id}", headers=headers_user_b)
    assert bob_del.status_code == 404

    # Alice can successfully delete her scan
    alice_del = client.delete(f"/api/v1/scans/{scan_id}", headers=headers_user_a)
    assert alice_del.status_code == 204

    # Confirm it is gone
    alice_check = client.get(f"/api/v1/scans/{scan_id}", headers=headers_user_a)
    assert alice_check.status_code == 404


def test_invalid_object_id_handling(client: TestClient):
    """
    Malformed or non-hex ObjectIds return 404 instead of 500 error.
    """
    headers = make_auth_header("user_alice")
    resp = client.get("/api/v1/scans/invalid-id-123", headers=headers)
    assert resp.status_code == 404
