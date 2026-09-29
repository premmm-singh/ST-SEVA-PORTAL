import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.grievance import (
    Grievance,
    GrievanceCategory,
    GrievanceStatus,
    GrievancePriority,
    HearingMode,
    GrievanceTimeline,
    GrievanceHearing,
    HelpdeskArticle
)
from app.services.grievance_service import GrievanceService
from app.core.security import create_access_token, hash_password

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def auth_tokens(db):
    officer_email = f"grv_officer_{uuid4().hex[:6]}@gov.in"
    student_email = f"grv_student_{uuid4().hex[:6]}@tribal.gov.in"

    officer = User(
        email=officer_email,
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    student = User(
        email=student_email,
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db.add_all([officer, student])
    db.commit()
    db.refresh(officer)
    db.refresh(student)

    officer_token = create_access_token(data={"sub": officer.id, "email": officer.email, "role": officer.role.value})
    student_token = create_access_token(data={"sub": student.id, "email": student.email, "role": student.role.value})

    return {
        "officer": officer,
        "student": student,
        "officer_headers": {"Authorization": f"Bearer {officer_token}"},
        "student_headers": {"Authorization": f"Bearer {student_token}"}
    }

def test_file_grievance_and_statutory_ticket(auth_tokens):
    """F-96 & F-97: File grievance, check ticket code format & 7-day SLA."""
    payload = {
        "subject": "Delayed Post-Matric Verification at Ranchi College",
        "description": "Application submitted 25 days ago. College nodal officer has not completed scrutiny.",
        "category": "INSTITUTION_HARASSMENT",
        "district": "Ranchi",
        "priority": "MEDIUM"
    }

    res = client.post("/api/v1/grievances/", json=payload, headers=auth_tokens["student_headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["ticket_number"].startswith("GRV-JH-")
    assert data["category"] == "INSTITUTION_HARASSMENT"
    assert data["status"] == "SUBMITTED"
    assert data["tier_level"] == 1
    assert data["is_sla_breached"] is False
    assert len(data["timelines"]) >= 1
    assert data["timelines"][0]["action"] == "FILED"

def test_public_grievance_tracking(auth_tokens):
    """F-101: Public tracking without any authorization token."""
    # First create a grievance
    payload = {
        "subject": "Disbursement Failure UTR Missing",
        "description": "Sanction order issued last month but DBT failed.",
        "category": "DISBURSEMENT_FAILURE",
        "district": "East Singhbhum",
        "priority": "HIGH"
    }
    create_res = client.post("/api/v1/grievances/", json=payload, headers=auth_tokens["student_headers"])
    ticket = create_res.json()["ticket_number"]

    # Public tracking (No Auth header)
    track_res = client.get(f"/api/v1/grievances/track/{ticket}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["ticket_number"] == ticket
    assert track_data["category"] == "DISBURSEMENT_FAILURE"
    assert track_data["district"] == "East Singhbhum"

def test_officer_queue_and_atr_resolution(auth_tokens):
    """F-98 & F-102: Officer queue review and Action Taken Report (ATR) with digital seal."""
    # Create ticket
    payload = {
        "subject": "Document Upload Error in Domicile Scan",
        "description": "System rejects high-resolution domicile certificate scan.",
        "category": "TECHNICAL_GLITCH",
        "district": "Khunti",
        "priority": "MEDIUM"
    }
    create_res = client.post("/api/v1/grievances/", json=payload, headers=auth_tokens["student_headers"])
    grv_id = create_res.json()["id"]

    # Officer checks queue
    queue_res = client.get("/api/v1/grievances/officer/queue?district=Khunti", headers=auth_tokens["officer_headers"])
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert any(g["id"] == grv_id for g in queue)

    # Officer resolves with Action Taken Report (ATR)
    action_payload = {
        "action": "RESOLVE",
        "remarks": "Assisted student with compression tool. Document uploaded and verified.",
        "resolution_summary": "Scan re-uploaded and approved by district desk.",
        "action_taken_report": "Direct intervention by DWO office. Portal server allowed re-upload."
    }
    action_res = client.post(f"/api/v1/grievances/{grv_id}/action", json=action_payload, headers=auth_tokens["officer_headers"])
    assert action_res.status_code == 200
    updated = action_res.json()
    assert updated["status"] == "RESOLVED"
    assert updated["atr_digital_seal"].startswith("ATR-SEAL-")
    assert updated["resolution_summary"] is not None

def test_schedule_hearing_workflow(auth_tokens):
    """F-100: Dispute hearing scheduling and attendance recording."""
    payload = {
        "subject": "Income Certificate Rejection Dispute",
        "description": "CO issued certificate rejected citing signature mismatch.",
        "category": "SCRUTINY_REJECTION",
        "district": "Dumka",
        "priority": "HIGH"
    }
    create_res = client.post("/api/v1/grievances/", json=payload, headers=auth_tokens["student_headers"])
    grv_id = create_res.json()["id"]

    # Schedule hearing
    hearing_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    hearing_payload = {
        "scheduled_at": hearing_time,
        "mode": "VIRTUAL_MEETING",
        "venue_or_link": "https://meet.gov.in/jh-st-dispute-room-4",
        "hearing_notes": "Both complainant and Circle Officer summoned to verify digital signature."
    }
    h_res = client.post(f"/api/v1/grievances/{grv_id}/schedule-hearing", json=hearing_payload, headers=auth_tokens["officer_headers"])
    assert h_res.status_code == 201
    hearing = h_res.json()
    assert hearing["status"] == "SCHEDULED"
    hearing_id = hearing["id"]

    # Update hearing outcome
    outcome_payload = {
        "attended_by_complainant": True,
        "hearing_notes": "Complainant presented original CO certificate. Signature verified valid.",
        "status": "COMPLETED"
    }
    out_res = client.post(f"/api/v1/grievances/hearing/{hearing_id}/outcome", json=outcome_payload, headers=auth_tokens["officer_headers"])
    assert out_res.status_code == 200
    assert out_res.json()["attended_by_complainant"] is True

def test_appeal_reopen_mechanism(auth_tokens):
    """F-103: Complainant appeals resolution within statutory window."""
    # Create and resolve ticket
    payload = {
        "subject": "Merit Objection Unaddressed",
        "description": "Objection was summarily dismissed without checking marksheet.",
        "category": "SCRUTINY_REJECTION",
        "district": "Ranchi"
    }
    create_res = client.post("/api/v1/grievances/", json=payload, headers=auth_tokens["student_headers"])
    grv_id = create_res.json()["id"]

    # Officer marks resolved
    client.post(
        f"/api/v1/grievances/{grv_id}/action",
        json={"action": "RESOLVE", "remarks": "Reviewed against merit cutoff. Rejected."},
        headers=auth_tokens["officer_headers"]
    )

    # Student appeals
    appeal_payload = {
        "appeal_reason": "DWO did not inspect my revaluation marksheet showing 88% marks."
    }
    appeal_res = client.post(f"/api/v1/grievances/{grv_id}/appeal", json=appeal_payload, headers=auth_tokens["student_headers"])
    assert appeal_res.status_code == 201
    assert appeal_res.json()["status"] == "SUCCESS"

    # Verify grievance is now in APPEALED status and Tier 3
    track_res = client.get(f"/api/v1/grievances/{grv_id}", headers=auth_tokens["student_headers"])
    assert track_res.json()["status"] == "APPEALED"
    assert track_res.json()["tier_level"] == 3

def test_sla_breach_and_auto_escalation(auth_tokens, db):
    """F-99: Statutory SLA Timer & Multi-Tier Escalation Engine."""
    # Create a grievance and artificially set deadline in the past
    payload = {
        "subject": "Application Stalled 45 Days",
        "description": "Completely stalled at Level 1.",
        "category": "APPLICATION_DELAY",
        "district": "Gumla"
    }
    create_res = client.post("/api/v1/grievances/", json=payload, headers=auth_tokens["student_headers"])
    grv_id = create_res.json()["id"]

    # Set SLA deadline to 2 days ago
    grv = db.query(Grievance).filter(Grievance.id == grv_id).first()
    grv.sla_deadline = datetime.now(timezone.utc) - timedelta(days=2)
    db.commit()

    # Run SLA auto-escalation
    esc_res = client.post("/api/v1/grievances/sla/run-escalations", headers=auth_tokens["officer_headers"])
    assert esc_res.status_code == 200
    esc_data = esc_res.json()
    assert esc_data["escalated_count"] >= 1

    # Verify escalated to Tier 2
    db.refresh(grv)
    assert grv.is_sla_breached is True
    assert grv.tier_level == 2
    assert grv.status == GrievanceStatus.ESCALATED_L2

def test_smart_faq_and_knowledgebase():
    """F-104: AI-Powered Smart FAQ & Knowledgebase search."""
    # Fetch FAQs (triggers seed if empty)
    faq_res = client.get("/api/v1/grievances/helpdesk/faq")
    assert faq_res.status_code == 200
    articles = faq_res.json()
    assert len(articles) >= 5

    # Search with keyword
    search_res = client.get("/api/v1/grievances/helpdesk/faq?query=caste")
    assert search_res.status_code == 200
    search_articles = search_res.json()
    assert len(search_articles) >= 1
    assert "Caste" in search_articles[0]["question"] or "caste" in search_articles[0]["tags"]

    # Record view
    art_id = articles[0]["id"]
    view_res = client.post(f"/api/v1/grievances/helpdesk/faq/{art_id}/view")
    assert view_res.status_code == 200
    assert view_res.json()["view_count"] >= 1

def test_whatsapp_bot_simulator(auth_tokens):
    """F-105: WhatsApp Grievance Intake & Status Bot simulation."""
    # Check status of existing ticket
    create_res = client.post("/api/v1/grievances/", json={
        "subject": "WhatsApp Integration Test",
        "description": "Testing mobile complaint intake.",
        "category": "OTHER",
        "district": "Ranchi"
    }, headers=auth_tokens["student_headers"])
    ticket = create_res.json()["ticket_number"]

    # Query bot with STATUS
    bot_status_res = client.post("/api/v1/grievances/whatsapp-bot", json={
        "phone_number": "+919876543210",
        "message_text": f"STATUS {ticket}"
    })
    assert bot_status_res.status_code == 200
    assert bot_status_res.json()["ticket_found"] is True
    assert ticket in bot_status_res.json()["reply"]

    # Query bot with NEW
    bot_new_res = client.post("/api/v1/grievances/whatsapp-bot", json={
        "phone_number": "+919876543210",
        "message_text": "NEW DELAY Verification taking more than 3 weeks"
    })
    assert bot_new_res.status_code == 200
    assert "GRV-JH-" in bot_new_res.json()["ticket_number"]

def test_external_sync_cpgrams(auth_tokens):
    """F-106: CPGRAMS & State Jansamvad Ingestion Adapter."""
    payload = {
        "external_source": "CPGRAMS",
        "external_reference_id": "DARPG/E/2026/00142",
        "subject": "Central Portal Complaint on DBT PFMS Delay",
        "description": "Beneficiary filed complaint on national CPGRAMS portal regarding scholarship delay.",
        "category": "DISBURSEMENT_FAILURE",
        "district": "Bokaro",
        "complainant_phone": "+919123456789"
    }
    sync_res = client.post("/api/v1/grievances/sync-external", json=payload, headers=auth_tokens["officer_headers"])
    assert sync_res.status_code == 201
    synced = sync_res.json()
    assert synced["external_source"] == "CPGRAMS"
    assert synced["external_reference_id"] == "DARPG/E/2026/00142"
    assert synced["district"] == "Bokaro"

def test_grievance_analytics_dashboard(auth_tokens):
    """F-107: Grievance Analytics, Heatmap & Officer Scorecard."""
    res = client.get("/api/v1/grievances/analytics/dashboard", headers=auth_tokens["officer_headers"])
    assert res.status_code == 200
    data = res.json()
    assert "total_grievances" in data
    assert "resolved_count" in data
    assert "sla_compliance_rate" in data
    assert "avg_resolution_hours" in data
    assert "district_breakdown" in data
    assert "tier_distribution" in data
    assert data["total_grievances"] >= 1
