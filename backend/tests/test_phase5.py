import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.application import Application, ApplicationTimeline
from app.db.models.scrutiny import (
    ScrutinyAction,
    DuplicateFlag,
    PhysicalInspection,
    DiscrepancyFlag
)

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module")
def officer_token():
    """Login as seeded District Welfare Officer (DWO Ranchi) and get JWT."""
    login_resp = client.post(
        "/api/v1/auth/login/email",
        json={"email": "officer.ranchi@stseva.gov.in", "password": "Officer@2026#Gov"}
    )
    assert login_resp.status_code == 200, f"DWO Login failed: {login_resp.text}"
    return login_resp.json()["access_token"]

@pytest.fixture(scope="module")
def demo_application(db: Session):
    """Retrieve demo application."""
    app_record = db.query(Application).filter(
        Application.application_number == "ST-2026-A83F19"
    ).first()
    assert app_record is not None
    return app_record

def test_welfare_officer_login_and_stats(officer_token):
    """Features 48 & 57: Fetch scrutiny dashboard counters and risk metrics."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    resp = client.get("/api/v1/scrutiny/dashboard-stats", headers=headers)
    assert resp.status_code == 200
    stats = resp.json()
    assert "pending_l1_count" in stats
    assert "pending_l2_count" in stats
    assert "total_count" in stats
    assert "red_risk_count" in stats
    assert stats["total_count"] >= 1

def test_scrutiny_queue_listing(officer_token):
    """Feature 48: Filterable scrutiny queue for Welfare Officers."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    resp = client.get("/api/v1/scrutiny/applications?stage=ALL", headers=headers)
    assert resp.status_code == 200
    apps = resp.json()
    assert isinstance(apps, list)
    assert len(apps) >= 1
    assert any(a["application_number"] == "ST-2026-A83F19" for a in apps)

def test_scrutiny_dossier_retrieval(officer_token, demo_application):
    """Features 48, 57: Comprehensive Welfare Officer Scrutiny Dossier."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    resp = client.get(f"/api/v1/scrutiny/applications/{demo_application.id}/dossier", headers=headers)
    assert resp.status_code == 200
    dossier = resp.json()
    assert dossier["application_number"] == demo_application.application_number
    assert "student_profile" in dossier
    assert "risk_assessment" in dossier
    assert "risk_level" in dossier["risk_assessment"]
    assert "duplicate_flags" in dossier
    assert "institutional_verification" in dossier

def test_caste_certificate_cross_verify(officer_token, demo_application):
    """Feature 49: Caste certificate verification against State Revenue (Jharsewa) stub."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # 1. Valid certificate
    payload = {
        "cert_type": "CASTE",
        "cert_number": "JH-CST-2023-884920",
        "sub_caste": "Munda"
    }
    resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/cross-verify",
        json=payload,
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is True
    assert data["details"]["community"] == "Scheduled Tribe (ST)"
    assert "Jharsewa" in data["details"]["registry_source"]

    # 2. Invalid certificate
    invalid_payload = {
        "cert_type": "CASTE",
        "cert_number": "INVALID-CST-000000"
    }
    resp_inv = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/cross-verify",
        json=invalid_payload,
        headers=headers
    )
    assert resp_inv.status_code == 200
    assert resp_inv.json()["verified"] is False

def test_income_certificate_cross_verify(officer_token, demo_application):
    """Feature 50: Income certificate verification & ceiling check."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    payload = {
        "cert_type": "INCOME",
        "cert_number": "JH-INC-2025-119284",
        "claimed_income": 120000.00
    }
    resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/cross-verify",
        json=payload,
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is True
    assert data["details"]["is_within_limit"] is True
    assert data["details"]["is_expired"] is False

def test_domicile_and_ration_card_cross_verify(officer_token, demo_application):
    """Features 51 & 52: Domicile in Scheduled Area and NFSA Ration Card stubs."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # Domicile
    dom_resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/cross-verify",
        json={"cert_type": "DOMICILE", "cert_number": "JH-DOM-2022-772910", "district": "Ranchi"},
        headers=headers
    )
    assert dom_resp.status_code == 200
    assert dom_resp.json()["verified"] is True
    assert dom_resp.json()["details"]["scheduled_area_notified"] is True

    # Ration card
    rc_resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/cross-verify",
        json={"cert_type": "RATION_CARD", "cert_number": "NFSA-JH-2007-88192"},
        headers=headers
    )
    assert rc_resp.status_code == 200
    assert rc_resp.json()["verified"] is True
    assert "PHH" in rc_resp.json()["details"]["card_type"]

def test_udid_disability_cross_verify(officer_token, demo_application):
    """Feature 55: UDID Disability Certificate Verification (>= 40% threshold)."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/cross-verify",
        json={"cert_type": "UDID", "cert_number": "JH201081992019482"},
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is True
    assert data["details"]["disability_percentage"] >= 40.0
    assert data["details"]["is_benchmark_eligible"] is True

def test_duplicate_detection_scan(officer_token, demo_application):
    """Feature 53: Multi-vector duplicate application detection scan."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/run-deduplication",
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "collisions_count" in data

def test_physical_spot_inspection_recording(officer_token, demo_application):
    """Feature 56: Physical spot inspection report with GPS coordinates."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    inspection_payload = {
        "institution_name": "Birsa Institute of Technology (BIT) Sindri",
        "latitude": 23.6521,
        "longitude": 86.4718,
        "location_address": "BIT Sindri Campus, Sindri, Dhanbad - 828123",
        "student_present": True,
        "hostel_room_verified": True,
        "inspection_summary": "Spot-inspected by DWO team. Student physically verified in CSE Department Lecture Hall 3 and Hostel Room 204."
    }
    resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/physical-inspection",
        json=inspection_payload,
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["student_present"] is True
    assert data["hostel_room_verified"] is True
    assert data["latitude"] == 23.6521
    assert "Sindri" in data["institution_name"]

def test_mandatory_checklist_enforcement(officer_token, demo_application):
    """Feature 58: Enforces mandatory statutory checkboxes before sign-off."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # Incomplete checklist (missing caste_verified) -> Must fail with 400
    incomplete_payload = {
        "scrutiny_level": "L1_SCRUTINY",
        "decision": "RECOMMENDED",
        "checklist": {
            "caste_verified": False, # Incomplete!
            "income_verified": True,
            "domicile_verified": True,
            "bonafide_verified": True,
            "dbt_eligible": True,
            "duplicate_check_passed": True
        },
        "remarks": "Incomplete verification"
    }
    resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/action",
        json=incomplete_payload,
        headers=headers
    )
    assert resp.status_code == 400
    assert "caste_verified" in resp.json()["detail"]

def test_l1_and_l2_scrutiny_workflow_progression(officer_token, demo_application):
    """Features 48 & 58: Multi-level scrutiny progression (L1 -> L2) with digital signature."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # 1. L1 Scrutiny: Scrutiny Assistant Recommends
    l1_payload = {
        "scrutiny_level": "L1_SCRUTINY",
        "decision": "RECOMMENDED",
        "checklist": {
            "caste_verified": True,
            "income_verified": True,
            "domicile_verified": True,
            "bonafide_verified": True,
            "dbt_eligible": True,
            "duplicate_check_passed": True
        },
        "remarks": "L1 Scrutiny Assistant verified certificates from Jharsewa & NFSA. Forwarded to DWO."
    }
    l1_resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/action",
        json=l1_payload,
        headers=headers
    )
    assert l1_resp.status_code == 200
    l1_data = l1_resp.json()
    assert l1_data["scrutiny_level"] == "L1_SCRUTINY"
    assert l1_data["decision"] == "RECOMMENDED"
    assert len(l1_data["digital_signature_hash"]) == 64

    # 2. L2 Verification: District Welfare Officer (DWO) Approves
    l2_payload = {
        "scrutiny_level": "L2_VERIFICATION",
        "decision": "APPROVED",
        "checklist": {
            "caste_verified": True,
            "income_verified": True,
            "domicile_verified": True,
            "bonafide_verified": True,
            "dbt_eligible": True,
            "duplicate_check_passed": True
        },
        "remarks": "DWO Ranchi approved application after reviewing spot inspection. Forwarded for Directorate Sanction."
    }
    l2_resp = client.post(
        f"/api/v1/scrutiny/applications/{demo_application.id}/action",
        json=l2_payload,
        headers=headers
    )
    assert l2_resp.status_code == 200
    l2_data = l2_resp.json()
    assert l2_data["scrutiny_level"] == "L2_VERIFICATION"
    assert l2_data["decision"] == "APPROVED"
    assert len(l2_data["digital_signature_hash"]) == 64

def test_clear_duplicate_flag(officer_token, db: Session, demo_application):
    """Feature 53: Officer justification for clearing a duplicate collision flag."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # Create test duplicate flag
    flag = DuplicateFlag(
        application_id=demo_application.id,
        match_type="IDENTITY_FUZZY",
        confidence_score=75.0,
        match_details="Similar name detected in historical archive."
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)

    clear_resp = client.post(
        f"/api/v1/scrutiny/flags/{flag.id}/clear",
        json={"remarks": "Verified different family lineage and father's identity in village census."},
        headers=headers
    )
    assert clear_resp.status_code == 200
    assert clear_resp.json()["is_cleared"] is True
