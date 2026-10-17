from starlette.testclient import TestClient

from tests.conftest import make_auth_header


def test_missing_auth_header_rejected(client: TestClient):
    resp = client.get("/api/v1/me")
    assert resp.status_code == 401
    assert "Authorization header missing" in resp.json()["detail"]


def test_malformed_auth_header_rejected(client: TestClient):
    resp1 = client.get("/api/v1/me", headers={"Authorization": "Basic 123456"})
    assert resp1.status_code == 401

    resp2 = client.get("/api/v1/me", headers={"Authorization": "Bearer"})
    assert resp2.status_code == 401


def test_valid_auth_me_profile_creation(client: TestClient):
    headers = make_auth_header("user_gamma_99")
    resp = client.get("/api/v1/me", headers=headers)
    assert resp.status_code == 200

    data = resp.json()
    assert data["firebase_uid"] == "user_gamma_99"
    assert "preferences" in data
    assert data["preferences"]["theme"] == "dark"
    assert "created_at" in data
    assert "updated_at" in data
