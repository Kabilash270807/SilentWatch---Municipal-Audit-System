import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth import auth_service

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["raw_audio_allowed"] is False
    assert data["admin_auth_enforced"] is True

def test_privacy_status_public_access():
    """Public citizen can inspect privacy audit without authentication."""
    response = client.get("/api/privacy/status")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_privacy_status"] == "STRICT_PRIVACY_ENFORCED"
    assert data["raw_audio_persisted"] is False
    assert len(data["checks"]) >= 5

def test_dashboard_public_access():
    """Citizens can view general dashboard noise summaries without logging in."""
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["valid_measurement_count"] > 0
    assert "category_distribution" in data

def test_reject_raw_audio_payload():
    """Privacy: Verifies raw audio uploads are rejected with HTTP 400."""
    payload = {
        "grid_id": "CBE-101",
        "estimated_level_dba": 55.4,
        "peak_level_dba": 62.1,
        "noise_floor_estimate": 48.0,
        "audio": "RIFF....forbidden_raw_binary..."
    }
    response = client.post("/api/measurements", json=payload)
    assert response.status_code == 400
    assert "Privacy violation" in response.json()["detail"]

# ------------------------------------------------------------------
# SECTION A: RESTRICTED INCIDENTS ACCESS CONTROL
# ------------------------------------------------------------------
def test_unauthenticated_cannot_access_incidents():
    """Citizens cannot access incident reports without admin auth (HTTP 401)."""
    response = client.get("/api/incidents")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

# ------------------------------------------------------------------
# SECTION B: RESTRICTED NIGHTTIME SCREENING ACCESS CONTROL
# ------------------------------------------------------------------
def test_unauthenticated_cannot_access_violations():
    """Citizens cannot access nighttime violation screening without admin auth (HTTP 401)."""
    response = client.get("/api/violations")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

# ------------------------------------------------------------------
# SECTION C: RESTRICTED MUNICIPAL AUDIT REPORTS ACCESS CONTROL
# ------------------------------------------------------------------
def test_unauthenticated_cannot_access_or_generate_audit_reports():
    """Citizens cannot access or generate audit reports without admin auth (HTTP 401)."""
    # Test GET reports
    response = client.get("/api/audit-reports")
    assert response.status_code == 401

    # Test POST generate report
    payload = {
        "grid_id": "CBE-101",
        "reporting_period_start": "2026-10-01T00:00:00Z",
        "reporting_period_end": "2026-10-07T23:59:59Z",
        "ruleset": "MUNICIPAL_STANDARD_2026"
    }
    response_gen = client.post("/api/audit-reports/generate", json=payload)
    assert response_gen.status_code == 401

# ------------------------------------------------------------------
# ADMINISTRATOR LOGIN, SESSION & PROTECTED ACTION FLOW
# ------------------------------------------------------------------
def test_admin_authentication_and_authorized_actions():
    # 1. Invalid credentials test
    bad_login = client.post("/api/admin/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword123!"
    })
    assert bad_login.status_code == 401

    # 2. Valid administrator login
    login_resp = client.post("/api/admin/login", json={
        "username_or_email": "teamqudex@gmail.com",
        "password": "admin"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["token"]
    assert token is not None
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Authenticated Admin accesses Incidents
    inc_resp = client.get("/api/incidents", headers=headers)
    assert inc_resp.status_code == 200
    assert len(inc_resp.json()) > 0

    # 4. Authenticated Admin accesses Nighttime Violations
    viol_resp = client.get("/api/violations", headers=headers)
    assert viol_resp.status_code == 200
    assert len(viol_resp.json()) > 0

    # 5. Authenticated Admin generates and views Audit Reports
    audit_payload = {
        "grid_id": "CBE-101",
        "reporting_period_start": "2026-10-01T00:00:00Z",
        "reporting_period_end": "2026-10-07T23:59:59Z",
        "ruleset": "MUNICIPAL_STANDARD_2026"
    }
    audit_gen = client.post("/api/audit-reports/generate", json=audit_payload, headers=headers)
    assert audit_gen.status_code == 200
    assert audit_gen.json()["monitoring_grid"] == "CBE-101"

    audit_list = client.get("/api/audit-reports", headers=headers)
    assert audit_list.status_code == 200

    # 6. Admin Logout invalidates token
    logout_resp = client.post("/api/admin/logout", headers=headers)
    assert logout_resp.status_code == 200

    # 7. Post-logout: token no longer valid
    denied_after_logout = client.get("/api/incidents", headers=headers)
    assert denied_after_logout.status_code == 401
