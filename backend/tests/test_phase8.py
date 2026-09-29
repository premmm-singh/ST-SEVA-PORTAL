import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.scheme import Scheme
from app.db.models.application import Application
from app.db.models.institution import InstitutionMaster, InstitutionProfile, DefectNotice
from app.db.models.notification import (
    Notification,
    NotificationPreference,
    NotificationDispatchLog,
    DeliveryChannel,
    DeliveryStatus,
    NotificationPriority,
    NotificationCategory,
    BroadcastCampaign,
    CommunicationAuditLog
)
from app.services.notification_service import NotificationService
from app.core.security import create_access_token, hash_password

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def auth_tokens(db):
    officer_email = f"notif_officer_{uuid4().hex[:6]}@gov.in"
    student_email = f"notif_student_{uuid4().hex[:6]}@tribal.gov.in"

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


def test_notification_preferences_crud(auth_tokens):
    headers = auth_tokens["student_headers"]
    
    # 1. Fetch preferences (auto-provisions defaults)
    resp = client.get("/api/v1/notifications/preferences", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["sms_enabled"] is True
    assert data["whatsapp_enabled"] is True
    assert data["preferred_language"] == "EN"

    # 2. Update preferences: enable Santali, quiet hours
    update_payload = {
        "preferred_language": "SANTALI",
        "dnd_start_hour": 22,
        "dnd_end_hour": 6,
        "email_enabled": False
    }
    update_resp = client.put("/api/v1/notifications/preferences", json=update_payload, headers=headers)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["preferred_language"] == "SANTALI"
    assert updated_data["email_enabled"] is False
    assert updated_data["dnd_start_hour"] == 22
    assert updated_data["dnd_end_hour"] == 6


def test_dlt_template_rendering_and_multilingual():
    context = {
        "student_name": "Birsa Munda",
        "application_number": "ST-2026-APP-999",
        "scheme_name": "Pre-Matric Tribal Scholarship",
        "amount": "15,000",
        "utr_number": "UTR-998877",
        "masked_account": "XXXX5678",
        "document_type": "Incomplete Caste Certificate",
        "sanction_order_number": "SO-2026-JH-001"
    }

    # English
    en_msg = NotificationService.render_template("APPLICATION_SUBMITTED", "EN", context)
    assert "ST-2026-APP-999" in en_msg
    assert "Birsa Munda" in en_msg

    # Hindi
    hi_msg = NotificationService.render_template("APPLICATION_SUBMITTED", "HI", context)
    assert "ST-2026-APP-999" in hi_msg
    assert "सफलतापूर्वक" in hi_msg

    # Santali (Ol Chiki)
    santali_msg = NotificationService.render_template("APPLICATION_SUBMITTED", "SANTALI", context)
    assert "ST-2026-APP-999" in santali_msg
    assert "ᱡᱚᱦᱟᱨ" in santali_msg


def test_trigger_milestone_notifications_and_in_app(auth_tokens, db):
    student = auth_tokens["student"]
    officer_headers = auth_tokens["officer_headers"]
    student_headers = auth_tokens["student_headers"]

    # Trigger Application Submitted
    submit_payload = {
        "event_type": "APPLICATION_SUBMITTED",
        "user_id": student.id,
        "context": {
            "application_number": "APP-TEST-001",
            "student_name": "Rani Soren",
            "mobile_number": "9876543210"
        }
    }
    resp1 = client.post("/api/v1/notifications/trigger-event", json=submit_payload, headers=officer_headers)
    assert resp1.status_code == 200
    notif1 = resp1.json()
    assert "Submitted" in notif1["title"]
    assert notif1["category"] == "APPLICATION"

    # Trigger Defect Raised (Urgent)
    defect_payload = {
        "event_type": "SCRUTINY_DEFECT_RAISED",
        "user_id": student.id,
        "context": {
            "application_number": "APP-TEST-001",
            "document_type": "Income Certificate",
            "mobile_number": "9876543210"
        }
    }
    resp2 = client.post("/api/v1/notifications/trigger-event", json=defect_payload, headers=officer_headers)
    assert resp2.status_code == 200
    notif2 = resp2.json()
    assert notif2["priority"] == "URGENT"
    assert notif2["category"] == "SCRUTINY"

    # Trigger DBT Credit Confirmed
    dbt_payload = {
        "event_type": "DBT_CREDIT_CONFIRMED",
        "user_id": student.id,
        "context": {
            "amount": "12,000",
            "masked_account": "XXXX9901",
            "utr_number": "PFMS-BANK-99901",
            "mobile_number": "9876543210"
        }
    }
    resp3 = client.post("/api/v1/notifications/trigger-event", json=dbt_payload, headers=officer_headers)
    assert resp3.status_code == 200

    # Student fetches in-app notifications
    notif_list_resp = client.get("/api/v1/notifications/my-notifications", headers=student_headers)
    assert notif_list_resp.status_code == 200
    list_data = notif_list_resp.json()
    assert list_data["unread_count"] >= 3
    assert len(list_data["items"]) >= 3

    # Mark first notification as read
    first_id = list_data["items"][0]["id"]
    mark_resp = client.post(f"/api/v1/notifications/{first_id}/mark-read", headers=student_headers)
    assert mark_resp.status_code == 200
    assert mark_resp.json()["is_read"] is True

    # Mark all remaining notifications as read
    mark_all_resp = client.post("/api/v1/notifications/mark-all-read", headers=student_headers)
    assert mark_all_resp.status_code == 200

    # Verify unread count is now 0
    refreshed_list = client.get("/api/v1/notifications/my-notifications", headers=student_headers).json()
    assert refreshed_list["unread_count"] == 0


def test_bulk_broadcast_campaign(auth_tokens, db):
    officer_headers = auth_tokens["officer_headers"]
    student = auth_tokens["student"]

    broadcast_payload = {
        "title": "Last Date Extended for Post-Matric Applications",
        "message_text": "Tribal Welfare Department has extended the online deadline to 31st October 2026. Submit before midnight.",
        "target_role": "STUDENT",
        "channels": ["IN_APP", "SMS", "WHATSAPP"]
    }

    resp = client.post("/api/v1/notifications/broadcast", json=broadcast_payload, headers=officer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_recipients"] >= 1
    assert data["success_count"] >= 1
    assert data["title"] == broadcast_payload["title"]

    # History list
    history_resp = client.get("/api/v1/notifications/broadcasts", headers=officer_headers)
    assert history_resp.status_code == 200
    assert len(history_resp.json()) >= 1


def test_dlr_webhook_ingestion(auth_tokens, db):
    student = auth_tokens["student"]

    # Create parent notification
    notif = Notification(
        user_id=student.id,
        category=NotificationCategory.APPLICATION,
        priority=NotificationPriority.NORMAL,
        title="Verification Progress Alert",
        message="Your application document has been approved."
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Create dispatch log
    dispatch_log = NotificationDispatchLog(
        notification_id=notif.id,
        recipient_address="9876543210",
        channel=DeliveryChannel.SMS,
        delivery_status=DeliveryStatus.SENT,
        dlt_template_id="DLT-TE-1001",
        gateway_ref_id=f"NIC-SMS-{uuid4().hex[:8]}"
    )
    db.add(dispatch_log)
    db.commit()
    db.refresh(dispatch_log)

    webhook_payload = {
        "gateway_ref_id": dispatch_log.gateway_ref_id,
        "delivery_status": "DELIVERED",
        "dlr_code": "000_SUCCESS",
        "failure_reason": None
    }

    resp = client.post("/api/v1/notifications/webhooks/dlr", json=webhook_payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "SUCCESS"
    assert resp.json()["delivery_status"] == "DELIVERED"

    # Verify updated in DB
    db.refresh(dispatch_log)
    assert dispatch_log.delivery_status == DeliveryStatus.DELIVERED
    assert dispatch_log.delivered_at is not None


def test_deadline_chasers_execution(auth_tokens, db):
    officer_headers = auth_tokens["officer_headers"]
    student = auth_tokens["student"]

    # Set up master institution & profile
    aishe = f"C-{uuid4().hex[:5]}"
    master_inst = InstitutionMaster(
        aishe_code=aishe,
        name="Ranchi Tribal Institute",
        state="JHARKHAND",
        district="RANCHI"
    )
    db.add(master_inst)
    db.commit()

    inst_user = User(
        email=f"inst_{uuid4().hex[:6]}@edu.in",
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.INSTITUTION,
        is_active=True
    )
    db.add(inst_user)
    db.commit()

    inst_profile = InstitutionProfile(
        user_id=inst_user.id,
        aishe_code=aishe,
        nodal_officer_name="Prof Soren",
        official_email="nodal@tribal.edu.in",
        contact_mobile="9876543210"
    )
    db.add(inst_profile)
    db.commit()

    # Set up scheme and application
    scheme = Scheme(
        id=f"SCHEME-{uuid4().hex[:6]}",
        scheme_name="Eklavya Incentive Scheme",
        scheme_code=f"EKL-{uuid4().hex[:6]}",
        academic_year="2026-2027",
        is_active=True
    )
    db.add(scheme)
    db.commit()
    db.refresh(scheme)

    app_record = Application(
        application_number=f"APP-CHASER-{uuid4().hex[:6]}",
        student_id=student.id,
        scheme_id=scheme.id,
        academic_year="2026-2027",
        status="DEFICIENT"
    )
    db.add(app_record)
    db.commit()
    db.refresh(app_record)

    # Defect notice with deadline within 24h (under the 48h chaser window)
    defect = DefectNotice(
        application_id=app_record.id,
        institution_id=inst_profile.id,
        defect_category="INCOME_CERTIFICATE_UNREADABLE",
        defect_description="Scanned copy is blurred",
        correction_deadline=datetime.now(timezone.utc) + timedelta(hours=24),
        is_resolved=False
    )
    db.add(defect)
    db.commit()

    # Trigger chasers
    chaser_resp = client.post("/api/v1/notifications/chasers/run", headers=officer_headers)
    assert chaser_resp.status_code == 200
    assert "Escalated" in chaser_resp.json()["message"]


def test_trai_compliance_audit_export(auth_tokens, db):
    officer_headers = auth_tokens["officer_headers"]
    
    resp = client.get("/api/v1/notifications/audit/trai-compliance", headers=officer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "generated_at" in data
    assert "total_dispatches" in data
    assert "trai_audit_seal" in data
    assert "records" in data
