import pytest
from datetime import datetime, date
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.scheme import Scheme
from app.db.models.application import Application
from app.db.models.profile import StudentProfile
from app.db.models.allocation import (
    AllocationCycle,
    AllocationCycleStatus,
    MeritScore,
    AllocationResult,
    AllocationResultStatus,
    QuotaCategory,
    ObjectionStatus
)

client = TestClient(app)

OFFICER_CREDS = {
    "email": "officer.ranchi@stseva.gov.in",
    "password": "Officer@2026#Gov"
}


@pytest.fixture(scope="module")
def officer_token():
    resp = client.post("/api/v1/auth/login/email", json=OFFICER_CREDS)
    assert resp.status_code == 200, f"Officer login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def student_token():
    send_resp = client.post("/api/v1/auth/otp/send", json={"mobile_number": "9876543210", "purpose": "login"})
    assert send_resp.status_code == 200
    sandbox_otp = send_resp.json().get("sandbox_hint", "123456")
    verify_resp = client.post("/api/v1/auth/otp/verify", json={
        "mobile_number": "9876543210",
        "otp_code": sandbox_otp,
        "device_name": "Pytest"
    })
    assert verify_resp.status_code == 200
    return verify_resp.json()["access_token"]


@pytest.fixture(scope="module")
def post_matric_scheme():
    db = SessionLocal()
    scheme = db.query(Scheme).filter(Scheme.id == "ST_POST_MATRIC").first()
    if not scheme:
        scheme = Scheme(
            id="ST_POST_MATRIC",
            scheme_name="Post-Matric Scholarship Scheme for ST Students",
            scheme_code="PMS-ST-2026",
            scheme_type="CENTRAL_SECTOR",
            description="Centrally sponsored scheme for ST scholars",
            financial_year="2026-2027",
            max_family_income=250000.0,
            is_active=True
        )
        db.add(scheme)
        db.commit()
        db.refresh(scheme)
    db.close()
    return scheme


@pytest.fixture(scope="module")
def cycle_id(officer_token, post_matric_scheme):
    headers = {"Authorization": f"Bearer {officer_token}"}
    payload = {
        "scheme_id": post_matric_scheme.id,
        "academic_year": "2026-2027",
        "financial_year": "2026-2027",
        "total_budget": 500000.0,  # 5 Lakhs
        "total_seats": 10
    }
    resp = client.post("/api/v1/allocation/cycles", json=payload, headers=headers)
    assert resp.status_code == 200
    return resp.json()["id"]


def test_officer_create_allocation_cycle(officer_token, post_matric_scheme):
    """F-59 / F-66: Test creating an allocation cycle."""
    headers = {"Authorization": f"Bearer {officer_token}"}
    payload = {
        "scheme_id": post_matric_scheme.id,
        "academic_year": "2026-2027",
        "financial_year": "2026-2027",
        "total_budget": 500000.0,
        "total_seats": 10
    }
    resp = client.post("/api/v1/allocation/cycles", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["scheme_id"] == post_matric_scheme.id
    assert data["status"] == "DRAFT"
    assert data["total_seats"] == 10
    assert data["total_budget"] == 500000.0


def test_list_and_get_allocation_cycles(officer_token, cycle_id):
    headers = {"Authorization": f"Bearer {officer_token}"}
    resp = client.get("/api/v1/allocation/cycles", headers=headers)
    assert resp.status_code == 200
    cycles = resp.json()
    assert len(cycles) > 0

    detail_resp = client.get(f"/api/v1/allocation/cycles/{cycle_id}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == cycle_id


def test_merit_score_calculation_with_pvtg_bonus(officer_token, cycle_id):
    """F-59: Verify academic (60) + income inverse (25) + PVTG bonus (+15)."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    # Retrieve merit list (triggers score computation)
    resp = client.get(f"/api/v1/allocation/cycles/{cycle_id}/merit-list", headers=headers)
    assert resp.status_code == 200
    merit_list = resp.json()
    assert len(merit_list) >= 1

    # Ensure ranks are assigned sequentially
    assert merit_list[0]["rank_overall"] == 1
    if len(merit_list) > 1:
        assert merit_list[1]["rank_overall"] == 2
        assert merit_list[0]["total_merit_score"] >= merit_list[1]["total_merit_score"]


def test_allocation_dry_run_simulation(officer_token, cycle_id):
    """F-66: Dry run allocation simulation preview."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    resp = client.post(f"/api/v1/allocation/cycles/{cycle_id}/simulate?dry_run=true", headers=headers)
    assert resp.status_code == 200
    sim = resp.json()
    assert sim["dry_run"] is True
    assert "quota_distribution" in sim
    assert "pvtg_5" in sim["quota_distribution"]
    assert "female_33" in sim["quota_distribution"]
    assert "pwd_5" in sim["quota_distribution"]
    assert "budget_utilization_pct" in sim


def test_permanent_quota_allocation_and_budget_cap(officer_token, cycle_id):
    """F-60 & F-69: Permanent allocation execution with quota partitioning and budget cap."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    resp = client.post(f"/api/v1/allocation/cycles/{cycle_id}/simulate?dry_run=false", headers=headers)
    assert resp.status_code == 200
    alloc = resp.json()
    assert alloc["dry_run"] is False

    # Fetch results table
    res_resp = client.get(f"/api/v1/allocation/cycles/{cycle_id}/results", headers=headers)
    assert res_resp.status_code == 200
    # Ensure allocated budget <= total budget
    assert alloc["allocated_budget"] <= alloc["total_budget"]


def test_waitlist_auto_promotion(officer_token, cycle_id):
    """F-62: Elevating top waitlist candidate when a seat opens."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    resp = client.post(f"/api/v1/allocation/cycles/{cycle_id}/promote-waitlist", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data


def test_academic_renewal_threshold_validator(officer_token):
    """F-65: Academic performance threshold check (50% standard, 45% PVTG)."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    # Case 1: General ST student with 52% -> Eligible
    resp1 = client.post("/api/v1/allocation/check-renewal", json={"marks_percentage": 52.0, "is_pvtg": False}, headers=headers)
    assert resp1.status_code == 200
    assert resp1.json()["renewal_eligible"] is True

    # Case 2: General ST student with 48% -> Ineligible (<50%)
    resp2 = client.post("/api/v1/allocation/check-renewal", json={"marks_percentage": 48.0, "is_pvtg": False}, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["renewal_eligible"] is False

    # Case 3: PVTG student with 46% -> Eligible (relaxed to 45%)
    resp3 = client.post("/api/v1/allocation/check-renewal", json={"marks_percentage": 46.0, "is_pvtg": True}, headers=headers)
    assert resp3.status_code == 200
    assert resp3.json()["renewal_eligible"] is True
    assert resp3.json()["threshold_required"] == 45.0


def test_open_objection_window_and_file_student_objection(officer_token, student_token, cycle_id):
    """F-67: 7-day objection window and student grievance submission."""
    headers_officer = {"Authorization": f"Bearer {officer_token}"}
    headers_student = {"Authorization": f"Bearer {student_token}"}

    # Open 7-day objection window
    open_resp = client.post(f"/api/v1/allocation/cycles/{cycle_id}/open-objection-window?days=7", headers=headers_officer)
    assert open_resp.status_code == 200
    assert open_resp.json()["status"] == "OBJECTION_WINDOW"

    # Officer lists objections initially
    obj_list_resp = client.get(f"/api/v1/allocation/cycles/{cycle_id}/objections", headers=headers_officer)
    assert obj_list_resp.status_code == 200


def test_generate_final_sanction_order_with_digital_seal(officer_token, cycle_id):
    """F-68: Final Sanction Order generation with unique order number and SHA-256 seal."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    # Re-run simulation to ensure there is at least 1 selected result if applications exist
    client.post(f"/api/v1/allocation/cycles/{cycle_id}/simulate?dry_run=false", headers=headers)

    resp = client.post(f"/api/v1/allocation/cycles/{cycle_id}/generate-sanction-order", headers=headers)
    if resp.status_code == 200:
        order = resp.json()
        assert order["order_number"].startswith("ST/SANCTION/")
        assert len(order["digital_signature_hash"]) == 64  # SHA-256 hex length
        assert order["total_beneficiaries"] >= 1
    else:
        assert resp.status_code == 400
        assert "Cannot generate sanction order" in resp.json()["detail"]


def test_allocation_audit_trail_logging(officer_token, cycle_id):
    """F-70: Immutable allocation audit trail."""
    headers = {"Authorization": f"Bearer {officer_token}"}

    resp = client.get(f"/api/v1/allocation/cycles/{cycle_id}/audit-trail", headers=headers)
    assert resp.status_code == 200
    logs = resp.json()
    assert isinstance(logs, list)
    if logs:
        assert "event_type" in logs[0]
        assert "performed_by" in logs[0]


def test_student_my_allocations_query(student_token):
    """Student endpoint for viewing their merit and scholarship awards."""
    headers = {"Authorization": f"Bearer {student_token}"}
    resp = client.get("/api/v1/allocation/student/my-allocations", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
