import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.application import Application, ApplicationTimeline
from app.db.models.institution import (
    InstitutionMaster,
    InstitutionProfile,
    InstitutionFeeStructure,
    InstitutionVerification,
    DefectNotice,
    InstitutionGrievance
)

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module")
def ino_token():
    """Login as seeded Institutional Nodal Officer (BIT Sindri) and get token."""
    login_resp = client.post(
        "/api/v1/auth/login/email",
        json={"email": "ino.bitsindri@stseva.gov.in", "password": "Institute@2026#Gov"}
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    return login_resp.json()["access_token"]

@pytest.fixture(scope="module")
def demo_application(db: Session):
    """Retrieve demo application mapped to C-44281."""
    app_record = db.query(Application).filter(
        Application.application_number == "ST-2026-A83F19"
    ).first()
    assert app_record is not None
    return app_record

def test_aishe_master_lookup():
    """Feature 37: Master Lookup of Accredited Higher Education Institutions."""
    resp = client.get("/api/v1/institutions/lookup?query=Sindri")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert any(inst["aishe_code"] == "C-44281" for inst in data)
    assert any("BIT" in inst["name"] for inst in data)

    # Lookup by AISHE Code
    resp_code = client.get("/api/v1/institutions/lookup?query=C-44312")
    assert resp_code.status_code == 200
    assert len(resp_code.json()) >= 1
    assert resp_code.json()[0]["aishe_code"] == "C-44312"

def test_institution_registration_workflow(db: Session):
    """Feature 37: Institutional Nodal Officer Onboarding."""
    unique_email = f"ino.stxaviers_{datetime.now().timestamp()}@stseva.gov.in"
    reg_payload = {
        "aishe_code": "C-44312",
        "nodal_officer_name": "Dr. Joseph Tirkey",
        "nodal_officer_designation": "Vice Principal & Nodal Officer",
        "official_email": unique_email,
        "contact_mobile": "9876543299",
        "password": "Xaviers@2026#Gov"
    }
    resp = client.post("/api/v1/institutions/register", json=reg_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["aishe_code"] == "C-44312"

    # Cleanup created user to keep tests idempotent
    created_user = db.query(User).filter(User.email == unique_email).first()
    if created_user:
        db.delete(created_user)
        db.commit()

def test_institution_profile(ino_token):
    """Fetch active institutional profile details."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    resp = client.get("/api/v1/institutions/profile", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["aishe_code"] == "C-44281"
    assert "BIT" in data["institution_name"] or "Birsa" in data["institution_name"]
    assert data["nodal_officer_name"] == "Prof. Rajeshwar Soren"

def test_institution_dashboard_stats(ino_token):
    """Feature 47: Institution Dashboard KPI counters."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    resp = client.get("/api/v1/institutions/dashboard-stats", headers=headers)
    assert resp.status_code == 200
    stats = resp.json()
    assert "pending_count" in stats
    assert "verified_count" in stats
    assert "defective_count" in stats
    assert "total_count" in stats
    assert stats["total_count"] >= 1

def test_institution_applications_list(ino_token):
    """Listing applications mapped to this institution's AISHE code."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    resp = client.get("/api/v1/institutions/applications", headers=headers)
    assert resp.status_code == 200
    apps = resp.json()
    assert isinstance(apps, list)
    assert len(apps) >= 1
    assert any(a["application_number"] == "ST-2026-A83F19" for a in apps)

def test_application_verification_details(ino_token, demo_application):
    """Features 38, 39, 41, 42: Student Verification Dossier."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    resp = client.get(f"/api/v1/institutions/applications/{demo_application.id}/details", headers=headers)
    assert resp.status_code == 200
    dossier = resp.json()
    assert dossier["application_number"] == demo_application.application_number
    assert "student_details" in dossier
    assert "academic_details" in dossier
    assert dossier["academic_details"]["institution_code_aishe"] == "C-44281"
    assert "fee_details" in dossier
    assert "documents" in dossier

def test_verify_student_bonafide_and_attendance_compliant(ino_token, demo_application):
    """Features 38, 40, 46: Verify Student Bonafide, 75% Attendance Rule & Digital Seal."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    verify_payload = {
        "bonafide_confirmed": True,
        "roll_number": "BIT-2023-CSE-018",
        "admission_year": 2023,
        "attendance_percentage": 84.5,
        "attendance_remarks": "Regular student with 84.5% academic attendance",
        "is_hosteller": True,
        "hostel_name": "Hostel No. 7 (Birsa Munda Bhavan)",
        "hostel_room_no": "Room 204",
        "fee_approved": 54000.0,
        "fee_status": "MATCH",
        "academic_verified": True,
        "previous_year_percentage": 78.4,
        "cgpa": 8.1,
        "has_uncleared_backlogs": False,
        "remarks": "Recommended for full ST Post-Matric Scholarship disbursement."
    }
    resp = client.post(
        f"/api/v1/institutions/applications/{demo_application.id}/verify",
        json=verify_payload,
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_status"] == "VERIFIED_AND_FORWARDED"
    assert data["attendance_compliant"] is True
    assert data["attendance_percentage"] == 84.5
    assert "digital_stamp" in data
    assert len(data["digital_stamp"]) == 64 # SHA-256 length

def test_attendance_under_75_percent_rule(ino_token, demo_application):
    """Feature 40: Ministry 75% Minimum Attendance Compliance Engine."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    verify_payload = {
        "bonafide_confirmed": True,
        "attendance_percentage": 68.0, # Below 75%
        "is_hosteller": False,
        "academic_verified": True
    }
    resp = client.post(
        f"/api/v1/institutions/applications/{demo_application.id}/verify",
        json=verify_payload,
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    # Below 75% must be flagged as non-compliant
    assert data["attendance_compliant"] is False
    assert data["attendance_percentage"] == 68.0

def test_return_defective_application(ino_token, demo_application):
    """Feature 44: Defective Application Return with Category & Correction Deadline."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    defect_payload = {
        "defect_category": "INCORRECT_FEE_RECEIPT",
        "defect_description": "Uploaded fee receipt is blurry and semester tuition fee does not match institutional ledger. Please upload clear original receipt.",
        "correction_deadline_days": 7
    }
    resp = client.post(
        f"/api/v1/institutions/applications/{demo_application.id}/return-defective",
        json=defect_payload,
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["application_status"] == "DEFICIENT"
    assert data["defect_category"] == "INCORRECT_FEE_RECEIPT"
    assert "correction_deadline" in data

def test_bulk_verify_workflow(ino_token, demo_application):
    """Feature 43: Bulk Verification Batch Workflow."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    bulk_payload = {
        "application_ids": [demo_application.id],
        "remarks": "Batch verified by Head of Computer Science Dept."
    }
    resp = client.post(
        "/api/v1/institutions/applications/bulk-verify",
        json=bulk_payload,
        headers=headers
    )
    assert resp.status_code == 200
    res = resp.json()
    assert res["total_processed"] == 1
    assert res["successful_count"] == 1
    assert res["failed_count"] == 0

def test_fee_structures_crud(ino_token):
    """Feature 39: Course Fee Structure Configuration."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    
    # 1. List
    list_resp = client.get("/api/v1/institutions/fee-structures", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 2. Create new course fee
    new_fee = {
        "course_name": "B.Tech Electrical Engineering",
        "academic_year": "2026-2027",
        "tuition_fee": 35000.0,
        "admission_fee": 2500.0,
        "exam_fee": 3000.0,
        "library_fee": 1500.0,
        "hostel_fee": 12000.0
    }
    create_resp = client.post("/api/v1/institutions/fee-structures", json=new_fee, headers=headers)
    assert create_resp.status_code == 200
    data = create_resp.json()
    assert data["total_annual_fee"] == 54000.0
    assert data["course_name"] == "B.Tech Electrical Engineering"

def test_institution_grievances_workflow(ino_token):
    """Feature 45: Institution Grievance Lodging & Tracking."""
    headers = {"Authorization": f"Bearer {ino_token}"}
    
    # 1. Submit grievance
    grv_payload = {
        "category": "QUOTA_INQUIRY",
        "subject": "Discrepancy in Top Class Education ST Quota Allocation for 2026",
        "description": "Our institute has 45 eligible ST engineering candidates but the sanctioned state portal limit shows 30.",
        "priority": "HIGH"
    }
    post_resp = client.post("/api/v1/institutions/grievances", json=grv_payload, headers=headers)
    assert post_resp.status_code == 200
    grv = post_resp.json()
    assert grv["ticket_number"].startswith("GRV-INST-2026-")
    assert grv["status"] == "OPEN"

    # 2. List grievances
    list_resp = client.get("/api/v1/institutions/grievances", headers=headers)
    assert list_resp.status_code == 200
    assert any(g["ticket_number"] == grv["ticket_number"] for g in list_resp.json())
