import pytest
import hashlib
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.scheme import Scheme
from app.db.models.dbt import PaymentBatch, PaymentBatchStatus
from app.core.security import create_access_token, hash_password

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def auth_tokens(db):
    unique = uuid4().hex[:6]

    # Officer
    officer = User(
        email=f"gw_officer_{unique}@gov.in",
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    db.add(officer)

    # Student
    student_mobile = f"987654{unique[:4]}"
    student = User(
        email=f"gw_student_{unique}@gmail.com",
        mobile_number_hash=hashlib.sha256(student_mobile.encode()).hexdigest(),
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db.add(student)

    # Scheme
    scheme = Scheme(
        id=f"PMS_GW_{unique}",
        scheme_name="Post-Matric Scholarship Gateway Test",
        scheme_code=f"PMS-GW-{unique}",
        scheme_type="CENTRALLY_SPONSORED",
        is_active=True
    )
    db.add(scheme)
    db.commit()
    db.refresh(officer)
    db.refresh(student)
    db.refresh(scheme)

    # Payment Batch
    batch = PaymentBatch(
        batch_number=f"BATCH-GW-{unique[:6]}",
        scheme_id=scheme.id,
        created_by_officer_id=officer.id,
        status=PaymentBatchStatus.DRAFT,
        total_records=2,
        total_amount=50000.0
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    return {
        "officer": officer,
        "officer_headers": {"Authorization": f"Bearer {create_access_token(data={'sub': officer.id, 'email': officer.email, 'role': officer.role.value})}"},
        "student": student,
        "student_mobile": student_mobile,
        "student_headers": {"Authorization": f"Bearer {create_access_token(data={'sub': student.id, 'email': student.email, 'role': student.role.value})}"},
        "batch": batch
    }

def test_digilocker_document_pull():
    """F-129: DigiLocker NeGD Production Gateway."""
    payload = {
        "uri": "in.gov.jh.jharsewa-CERT-CASTE-908124",
        "consent_artifact_id": "CONSENT-ARTEFACT-JH-01"
    }
    res = client.post("/api/v1/gateways/digilocker/pull-document", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["uri"] == payload["uri"]
    assert "in.gov.jh.jharsewa" in data["issuer_id"]
    assert data["is_signature_valid"] is True
    assert data["document_type"] == "CASTE_CERTIFICATE"

def test_aadhaar_vault_tokenization(auth_tokens):
    """F-130: UIDAI Aadhaar Vault & Tokenization Engine."""
    payload = {
        "raw_aadhaar_number": "548912349081"
    }
    res = client.post("/api/v1/gateways/aadhaar/tokenize", json=payload, headers=auth_tokens["student_headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["vault_token"].startswith("UIDAI-VLT-")
    assert data["masked_aadhaar"] == "XXXXXXXX9081"
    assert data["encryption_algorithm"] == "AES-256-GCM"
    assert data["is_ekyc_verified"] is True

def test_npci_mapper_batch_sync(auth_tokens):
    """F-131: NPCI Aadhaar Payment Bridge (APB) Mapper Ingestion."""
    batch_ref = f"NPCI-FEED-{uuid4().hex[:6].upper()}"
    payload = {
        "batch_reference": batch_ref,
        "records": [
            {
                "aadhaar_vault_token": "UIDAI-VLT-9801AABBCC",
                "bank_iin": "607152",
                "bank_name": "State Bank of India",
                "account_number_masked": "XXXXXX9012",
                "seeding_status": "ACTIVE"
            },
            {
                "aadhaar_vault_token": "UIDAI-VLT-1122DDEEFF",
                "bank_iin": "508534",
                "bank_name": "Bank of India",
                "account_number_masked": "XXXXXX4481",
                "seeding_status": "DORMANT"
            }
        ]
    }
    res = client.post("/api/v1/gateways/npci/sync-mapper", json=payload, headers=auth_tokens["officer_headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["batch_reference"] == batch_ref
    assert data["synced_records_count"] == 2
    assert data["active_count"] == 1
    assert data["dormant_count"] == 1

def test_npci_mapper_status_lookup(auth_tokens):
    """F-131: NPCI Seeding Status Lookup by Vault Token."""
    res = client.get("/api/v1/gateways/npci/lookup/UIDAI-VLT-9801AABBCC")
    assert res.status_code == 200
    data = res.json()
    assert data["bank_iin"] == "607152"
    assert data["bank_name"] == "State Bank of India"
    assert data["seeding_status"] == "ACTIVE"

def test_pfms_batch_xml_dsc_dispatch(auth_tokens):
    """F-132: PFMS Core XML Exchange & Digital Signature (DSC)."""
    payload = {
        "batch_id": auth_tokens["batch"].id,
        "dsc_token_id": "DSC-TOKEN-RANCHI-DWO-01"
    }
    res = client.post("/api/v1/gateways/pfms/dispatch-batch", json=payload, headers=auth_tokens["officer_headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["batch_id"] == auth_tokens["batch"].id
    assert data["status"] == "DISPATCHED"
    assert "PFMSPaymentFile" in data["xml_payload_preview"]
    assert data["dsc_signature"].startswith("X509_PKCS7_")
    assert data["pfms_acknowledgment_id"].startswith("ACK-PFMS-")

def test_aishe_master_directory_lookup():
    """F-133: AISHE Master Directory Sync & College Verification API."""
    res = client.get("/api/v1/gateways/aishe/verify/C-44281")
    assert res.status_code == 200
    data = res.json()
    assert data["aishe_code"] == "C-44281"
    assert "Birsa Institute of Technology" in data["institution_name"]
    assert data["district"] == "Dhanbad"
    assert data["naac_grade"] == "A+"

def test_academic_board_marks_verification():
    """F-134: Academic Examination Boards (CBSE/JAC) e-Marksheet Webhooks."""
    payload = {
        "board_name": "JAC",
        "roll_code": "23041",
        "roll_number": "10048",
        "passing_year": 2025
    }
    res = client.post("/api/v1/gateways/academic/verify-marks", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["board_name"] == "JAC"
    assert data["percentage"] > 75.0
    assert data["verified_digitally"] is True

def test_jharsewa_certificate_verification():
    """F-135: JharSewa / e-District Caste & Income Certificate API."""
    payload = {
        "certificate_number": "JH-CASTE-2025-99881",
        "applicant_name": "Sunita Birhor",
        "certificate_type": "CASTE"
    }
    res = client.post("/api/v1/gateways/jharsewa/verify-certificate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["certificate_number"] == payload["certificate_number"]
    assert data["is_valid"] is True
    assert "SDO" in data["issuing_authority"]
    assert "Birhor" in data["sub_caste"]

def test_umang_mobile_app_sso_exchange(auth_tokens):
    """F-136: UMANG Mobile App REST Gateway & SSO."""
    payload = {
        "umang_auth_token": "UMANG-OAUTH-TOKEN-SECURE-9941",
        "mobile_number": auth_tokens["student_mobile"]
    }
    res = client.post("/api/v1/gateways/umang/sso-exchange", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "portal_access_token" in data
    assert data["user_id"] == auth_tokens["student"].id
    assert data["role"] == "student"

def test_webhook_subscription_and_rate_limiter(auth_tokens):
    """F-137 & F-138: Webhook Subscription Hub & Token Bucket Rate Limiter."""
    # 1. Subscribe to webhook
    sub_payload = {
        "subscriber_name": "Ranchi University Integration Cell",
        "target_url": "https://univ.ranchi.ac.in/api/st-scholarship/webhook",
        "event_types": "APPLICATION_SUBMITTED,SANCTION_ISSUED"
    }
    sub_res = client.post("/api/v1/gateways/webhooks/subscribe", json=sub_payload, headers=auth_tokens["officer_headers"])
    assert sub_res.status_code == 201
    sub_data = sub_res.json()
    assert sub_data["subscriber_name"] == sub_payload["subscriber_name"]
    assert sub_data["secret_key"].startswith("whsec_")

    # 2. Get webhook logs
    log_res = client.get("/api/v1/gateways/webhooks/logs", headers=auth_tokens["officer_headers"])
    assert log_res.status_code == 200

    # 3. Test Rate Limiter Check (F-138)
    rl_res = client.get("/api/v1/gateways/rate-limit/check")
    assert rl_res.status_code == 200
    rl_data = rl_res.json()
    assert rl_data["allowed"] is True
    assert rl_data["tokens_remaining"] >= 0
