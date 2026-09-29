import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.core.security import hash_password

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_security_user(db_session: Session):
    unique_email = f"security_officer_p14_{uuid.uuid4().hex[:6]}@jharkhand.gov.in"
    user = User(
        email=unique_email,
        hashed_password=hash_password("SecOfficer@2026"),
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_security_headers_compliance(client: TestClient):
    res = client.get("/api/v1/vapt/headers/status")
    assert res.status_code == 200
    data = res.json()
    assert data["hsts_enabled"] is True
    assert "frame-ancestors 'none'" in data["csp_header"]
    assert data["x_frame_options"] == "DENY"
    assert data["x_content_type_options"] == "nosniff"
    assert "CERT_IN" in data["cert_in_compliance_status"]


def test_input_sanitization_sqli(client: TestClient):
    attack_payload = "' UNION SELECT username, password FROM users --"
    res = client.post(f"/api/v1/vapt/sanitize/probe?payload={attack_payload}&injection_type=SQLI")
    assert res.status_code == 200
    data = res.json()
    assert data["is_blocked"] is True
    assert "[BLOCKED_SQL_INJECTION]" in data["sanitized_output"]


def test_input_sanitization_xss(client: TestClient):
    attack_payload = "<script>alert('pwned')</script>"
    res = client.post(f"/api/v1/vapt/sanitize/probe?payload={attack_payload}&injection_type=XSS")
    assert res.status_code == 200
    data = res.json()
    assert data["is_blocked"] is True
    assert "[BLOCKED_XSS]" in data["sanitized_output"]


def test_input_sanitization_path_traversal(client: TestClient):
    attack_payload = "../../../../../etc/passwd"
    res = client.post(f"/api/v1/vapt/sanitize/probe?payload={attack_payload}&injection_type=PATH_TRAVERSAL")
    assert res.status_code == 200
    data = res.json()
    assert data["is_blocked"] is True
    assert "../" not in data["sanitized_output"]


def test_merkle_leaf_recording_and_proof(client: TestClient):
    sanction_id = f"SANCTION-{uuid.uuid4().hex[:8].upper()}"
    payload = {
        "record_id": sanction_id,
        "entity_type": "SANCTION_ORDER",
        "data_payload": {
            "amount": 48000,
            "beneficiary_count": 1,
            "district": "Khunti",
            "treasury_code": "JH-TR-01"
        }
    }
    res = client.post("/api/v1/vapt/merkle/record-leaf", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["record_id"] == sanction_id
    assert len(data["leaf_hash"]) == 64
    assert len(data["root_hash"]) == 64
    assert data["is_tamper_evident"] is True
    assert len(data["audit_proof_chain"]) >= 2


def test_merkle_zero_tamper_verification(client: TestClient):
    sanction_id = f"SANCTION-VERIFY-{uuid.uuid4().hex[:8].upper()}"
    payload = {
        "record_id": sanction_id,
        "entity_type": "SANCTION_ORDER",
        "data_payload": {"approved_by": "DWO_RANCHI", "total_fund": 120000}
    }
    res_record = client.post("/api/v1/vapt/merkle/record-leaf", json=payload)
    assert res_record.status_code == 200

    # Verify endpoint
    res_verify = client.get(f"/api/v1/vapt/merkle/verify/{sanction_id}")
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["record_id"] == sanction_id
    assert verify_data["is_tamper_free"] is True
    assert verify_data["audit_status"] == "IMMUTABLE_CHAIN_CONFIRMED"


def test_vapt_automated_scan_run(client: TestClient):
    payload = {
        "scan_type": "CERT_IN_AUDIT",
        "target_component": "PORTAL_API_CORE",
        "include_privilege_escalation": True
    }
    res = client.post("/api/v1/vapt/scan/run", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["cert_in_score"] >= 95.0
    assert data["compliance_grade"] == "A+"
    assert data["total_checks"] >= 50
    assert data["failed_checks"] == 0
    assert len(data["findings"]) >= 5


def test_session_anomaly_normal_location(client: TestClient, test_security_user: User):
    payload = {
        "user_id": test_security_user.id,
        "current_ip": "103.24.12.15",
        "current_city": "Ranchi"
    }
    res = client.post("/api/v1/vapt/sessions/anomaly-check", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["anomaly_detected"] is False
    assert data["risk_score"] < 50.0
    assert data["action_required"] == "NONE"


def test_session_anomaly_sudden_geographic_jump(client: TestClient, test_security_user: User):
    payload = {
        "user_id": test_security_user.id,
        "current_ip": "194.26.29.102",
        "current_city": "Frankfurt"
    }
    res = client.post("/api/v1/vapt/sessions/anomaly-check", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["anomaly_detected"] is True
    assert data["anomaly_type"] == "IP_ROAMING_JUMP"
    assert data["risk_score"] >= 80.0
    assert data["action_required"] == "MFA_STEP_UP"
