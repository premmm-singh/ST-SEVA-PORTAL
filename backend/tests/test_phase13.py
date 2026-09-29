import pytest
import uuid
import secrets
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db, SessionLocal
from app.db.models.user import User, UserRole
from app.core.security import hash_password
from app.db.models.mobile import OfflineSyncQueue, BiometricCredential

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
def test_mobile_user(db_session: Session):
    unique_email = f"tribal_student_p13_{uuid.uuid4().hex[:6]}@jharkhand.gov.in"
    user = User(
        email=unique_email,
        hashed_password=hash_password("MobilePass@2026"),
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_offline_application_draft_batch_sync(client: TestClient, test_mobile_user: User):
    login_res = client.post(
        "/api/v1/auth/login/email",
        json={"email": test_mobile_user.email, "password": "MobilePass@2026"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    idemp_token = f"IDEMP-DRAFT-{uuid.uuid4().hex}"
    payload = {
        "device_id": "DEVICE-ANDROID-SAMSUNG-M31-RANCHI",
        "items": [
            {
                "idempotency_token": idemp_token,
                "entity_type": "APPLICATION_DRAFT",
                "action": "UPDATE",
                "payload": {
                    "academic_details": {"class": "12", "school": "SS High School, Khunti"},
                    "caste_certificate_no": "JH/CASTE/2025/9981"
                }
            }
        ]
    }

    res = client.post("/api/v1/mobile/sync/offline-batch", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["device_id"] == "DEVICE-ANDROID-SAMSUNG-M31-RANCHI"
    assert data["synced_count"] == 1
    assert data["results"][0]["status"] == "SYNCED"
    assert data["results"][0]["idempotency_token"] == idemp_token


def test_offline_grievance_batch_sync(client: TestClient):
    idemp_token = f"IDEMP-GR-{uuid.uuid4().hex}"
    payload = {
        "device_id": "DEVICE-REDMI-NOTE-DUMKA",
        "items": [
            {
                "idempotency_token": idemp_token,
                "entity_type": "GRIEVANCE",
                "action": "CREATE",
                "payload": {
                    "applicant_name": "Soma Soren",
                    "applicant_mobile": "9876501234",
                    "subject": "Delay in Institute Verification",
                    "description": "Submitted application 3 weeks ago in rural Dumka CSC."
                }
            }
        ]
    }

    res = client.post("/api/v1/mobile/sync/offline-batch", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["synced_count"] == 1
    assert data["results"][0]["status"] == "SYNCED"
    assert "GR-OFFLINE-" in data["results"][0]["server_entity_id"]


def test_offline_idempotent_replay(client: TestClient):
    idemp_token = f"IDEMP-REPLAY-{uuid.uuid4().hex}"
    payload = {
        "device_id": "DEVICE-CSC-SIMDEGA",
        "items": [
            {
                "idempotency_token": idemp_token,
                "entity_type": "GRIEVANCE",
                "action": "CREATE",
                "payload": {"applicant_name": "Ramu Oraon"}
            }
        ]
    }

    # First attempt
    res1 = client.post("/api/v1/mobile/sync/offline-batch", json=payload)
    assert res1.status_code == 200
    assert res1.json()["synced_count"] == 1

    # Second attempt (replay)
    res2 = client.post("/api/v1/mobile/sync/offline-batch", json=payload)
    assert res2.status_code == 200
    assert res2.json()["results"][0]["status"] == "SYNCED"
    assert "already synced" in res2.json()["results"][0]["message"]


def test_vernacular_translations_english(client: TestClient):
    res = client.get("/api/v1/mobile/i18n/translations?lang=en")
    assert res.status_code == 200
    data = res.json()
    assert data["language_code"] == "en"
    assert data["language_name"] == "English"
    assert "portal_title" in data["strings"]


def test_vernacular_translations_hindi(client: TestClient):
    res = client.get("/api/v1/mobile/i18n/translations?lang=hi")
    assert res.status_code == 200
    data = res.json()
    assert data["language_code"] == "hi"
    assert data["script_name"] == "Devanagari"
    assert "अनुसूचित जनजाति छात्रवृत्ति" in data["strings"]["portal_title"]


def test_vernacular_translations_santhali(client: TestClient):
    res = client.get("/api/v1/mobile/i18n/translations?lang=sat")
    assert res.status_code == 200
    data = res.json()
    assert data["language_code"] == "sat"
    assert "Ol Chiki" in data["script_name"]
    assert "ᱥᱟᱱᱛᱟᱲᱤ" in data["language_name"]
    assert "ᱥᱠᱚᱞᱟᱨᱥᱤᱯ" in data["strings"]["portal_title"]


def test_vernacular_translations_ho_and_mundari(client: TestClient):
    res_ho = client.get("/api/v1/mobile/i18n/translations?lang=hoc")
    assert res_ho.status_code == 200
    assert res_ho.json()["language_code"] == "hoc"

    res_mun = client.get("/api/v1/mobile/i18n/translations?lang=unr")
    assert res_mun.status_code == 200
    assert res_mun.json()["language_code"] == "unr"


def test_document_compression_2g_optimization(client: TestClient):
    payload = {
        "filename": "caste_certificate_raw_scan.pdf",
        "file_type": "application/pdf",
        "original_size_kb": 1200.0,
        "quality_tier": "2G_ULTRA_LOW"
    }
    res = client.post("/api/v1/mobile/optimize/document", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_2g_optimized"] is True
    assert data["compressed_size_kb"] < 250.0
    assert data["compression_ratio"] < 0.25
    assert data["legibility_score"] >= 0.90


def test_document_compression_3g_tier(client: TestClient):
    payload = {
        "filename": "marksheet_photo.jpg",
        "file_type": "image/jpeg",
        "original_size_kb": 800.0,
        "quality_tier": "3G_BALANCED"
    }
    res = client.post("/api/v1/mobile/optimize/document", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["compressed_size_kb"] <= 350.0
    assert data["legibility_score"] >= 0.95


def test_audio_prompt_voice_assist(client: TestClient):
    res_hi = client.get("/api/v1/mobile/accessibility/audio-prompt?key=welcome_instructions&lang=hi")
    assert res_hi.status_code == 200
    assert "आधार कार्ड" in res_hi.json()["transcript"]

    res_sat = client.get("/api/v1/mobile/accessibility/audio-prompt?key=welcome_instructions&lang=sat")
    assert res_sat.status_code == 200
    assert "ᱟᱫᱷᱟᱨ" in res_sat.json()["transcript"]


def test_webauthn_biometric_enrollment_and_login(client: TestClient, test_mobile_user: User):
    login_res = client.post(
        "/api/v1/auth/login/email",
        json={"email": test_mobile_user.email, "password": "MobilePass@2026"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register Options Challenge
    opt_res = client.post("/api/v1/mobile/auth/webauthn/register-options", json={"device_name": "OnePlus Fingerprint"}, headers=headers)
    assert opt_res.status_code == 200
    challenge = opt_res.json()["challenge"]
    assert len(challenge) > 10

    # 2. Register Verify & Store Credential
    cred_id = f"FIDO2-CRED-{uuid.uuid4().hex}"
    verify_payload = {
        "credential_id": cred_id,
        "public_key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0...",
        "attestation_type": "none",
        "device_name": "OnePlus Fingerprint"
    }
    reg_res = client.post("/api/v1/mobile/auth/webauthn/register-verify", json=verify_payload, headers=headers)
    assert reg_res.status_code == 200
    assert reg_res.json()["status"] == "REGISTERED"

    # 3. Login Options Challenge
    login_opt_res = client.post(f"/api/v1/mobile/auth/webauthn/login-options?email={test_mobile_user.email}")
    assert login_opt_res.status_code == 200
    login_challenge = login_opt_res.json()["challenge"]

    # 4. Login Verify & Authenticate
    login_verify_payload = {
        "credential_id": cred_id,
        "signature": "MEUCIQCHX129841804...mock_biometric_signature",
        "challenge": login_challenge
    }
    bio_login_res = client.post("/api/v1/mobile/auth/webauthn/login-verify", json=login_verify_payload)
    assert bio_login_res.status_code == 200
    auth_data = bio_login_res.json()
    assert "access_token" in auth_data
    assert auth_data["user_id"] == test_mobile_user.id
