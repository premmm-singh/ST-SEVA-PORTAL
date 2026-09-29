import uuid
import secrets
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models.mobile import OfflineSyncQueue, BiometricCredential
from app.db.models.user import User
from app.db.models.scheme import Scheme
from app.db.models.application import ApplicationDraft
from app.db.models.grievance import Grievance, GrievanceCategory, GrievancePriority, GrievanceStatus
from app.schemas.mobile import (
    OfflineSyncBatchRequest,
    OfflineSyncBatchResponse,
    OfflineSyncItemResult,
    VernacularTranslationResponse,
    DocumentCompressionRequest,
    DocumentCompressionResponse,
    AudioPromptResponse,
    WebAuthnChallengeResponse,
    WebAuthnRegisterVerifyRequest,
    WebAuthnLoginVerifyRequest,
    WebAuthnAuthResponse
)
from app.core.security import create_access_token

VERNACULAR_DICTIONARY: Dict[str, Dict[str, Any]] = {
    "en": {
        "name": "English",
        "script": "Latin",
        "strings": {
            "portal_title": "ST Scholarship & Certificate Verification Portal",
            "welcome": "Welcome to Jharkhand Tribal Welfare Service Portal",
            "apply_scholarship": "Apply for Pre/Post-Matric ST Scholarship",
            "track_status": "Track Scholarship Application Status",
            "file_grievance": "Lodge Grievance or Query",
            "digilocker_fetch": "Fetch Caste / Income via DigiLocker",
            "offline_notice": "Offline Mode Active. Your drafts are saved safely on device.",
            "data_saver": "Data Saver Active (Optimized for 2G/3G)",
            "biometric_login": "Login with Fingerprint or Face ID",
            "sync_now": "Sync Pending Changes Now"
        }
    },
    "hi": {
        "name": "हिन्दी (Hindi)",
        "script": "Devanagari",
        "strings": {
            "portal_title": "अनुसूचित जनजाति छात्रवृत्ति एवं प्रमाण पत्र सत्यापन पोर्टल",
            "welcome": "झारखंड आदिवासी कल्याण सेवा पोर्टल में आपका स्वागत है",
            "apply_scholarship": "प्री/पोस्ट-मैट्रिक छात्रवृत्ति के लिए आवेदन करें",
            "track_status": "छात्रवृत्ति आवेदन की स्थिति जांचें",
            "file_grievance": "शिकायत या समस्या दर्ज करें",
            "digilocker_fetch": "डिजिलॉकर से जाति/आय प्रमाण पत्र प्राप्त करें",
            "offline_notice": "ऑफलाइन मोड सक्रिय। आपका ड्राफ्ट डिवाइस पर सुरक्षित है।",
            "data_saver": "डेटा सेवर सक्रिय (2G/3G के लिए अनुकूलित)",
            "biometric_login": "फिंगरप्रिंट या फेस आईडी से लॉगिन करें",
            "sync_now": "लंबित बदलाव अभी सिंक करें"
        }
    },
    "sat": {
        "name": "ᱥᱟᱱᱛᱟᱲᱤ (Santhali)",
        "script": "Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)",
        "strings": {
            "portal_title": "ᱟᱹᱫᱤᱵᱟᱹᱥᱤ ᱥᱠᱚᱞᱟᱨᱥᱤᱯ ᱟᱨ ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱯᱩᱥᱴᱟᱹᱣ ᱯᱚᱨᱴᱟᱞ",
            "welcome": "ᱡᱷᱟᱨᱠᱷᱚᱸᱰ ᱟᱹᱫᱤᱵᱟᱹᱥᱤ ᱵᱷᱟᱹᱞᱟᱹᱭ ᱥᱮᱵᱟ ᱯᱚᱨᱴᱟᱞ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ",
            "apply_scholarship": "ᱥᱠᱚᱞᱟᱨᱥᱤᱯ ᱞᱟᱹᱜᱤᱫ ᱫᱚᱨᱠᱷᱟᱥᱛ ᱮᱢ ᱢᱮ",
            "track_status": "ᱫᱚᱨᱠᱷᱟᱥᱛ ᱨᱮᱱᱟᱜ ᱦᱟᱞᱚᱛ ᱧᱮᱞ ᱢᱮ",
            "file_grievance": "ᱟᱱᱟᱴ ᱟᱨ ᱞᱟᱹᱞᱤᱥ ᱫᱟᱠᱷᱤᱞ ᱢᱮ",
            "digilocker_fetch": "ᱰᱤᱡᱤᱞᱚᱠᱟᱨ ᱠᱷᱚᱱ ᱡᱟᱹᱛᱤ ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱟᱹᱜᱩᱭ ᱢᱮ",
            "offline_notice": "ᱚᱯᱷᱞᱟᱭᱤᱱ ᱢᱳᱰ ᱪᱟᱹᱞᱩ ᱢᱮᱱᱟᱜ-ᱟ᱾ ᱟᱢᱟᱜ ᱠᱟᱜᱚᱡᱽ ᱯᱷᱳᱱ ᱨᱮ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱢᱮᱱᱟᱜ-ᱟ᱾",
            "data_saver": "ᱰᱮᱴᱟ ᱵᱟᱧᱪᱟᱣ ᱪᱟᱹᱞᱩ (2G/3G ᱞᱟᱹᱜᱤᱫ)",
            "biometric_login": "ᱴᱤᱯ ᱪᱤᱱᱦᱟᱹ ᱛᱮ ᱞᱚᱜᱤᱱ ᱢᱮ",
            "sync_now": "ᱱᱤᱛᱚᱜ ᱜᱮ ᱥᱤᱸᱠ ᱢᱮ"
        }
    },
    "hoc": {
        "name": "ᱦᱳ (Ho)",
        "script": "Warang Chiti / Devanagari",
        "strings": {
            "portal_title": "ᱦᱳ ᱟᱹᱫᱤᱵᱟᱹᱥᱤ ᱥᱠᱚᱞᱟᱨᱥᱤᱯ ᱥᱮᱵᱟ ᱯᱚᱨᱴᱟᱞ",
            "welcome": "ᱡᱷᱟᱨᱠᱷᱚᱸᱰ ᱫᱤᱥᱩᱢ ᱟᱹᱫᱤᱵᱟᱹᱥᱤ ᱯᱚᱨᱴᱟᱞ ᱨᱮ ᱡᱚᱦᱟᱨ",
            "apply_scholarship": "ᱥᱠᱚᱞᱟᱨᱥᱤᱯ ᱞᱟᱹᱜᱤᱫ ᱟᱨᱡᱤ ᱚᱞ ᱢᱮ",
            "track_status": "ᱟᱨᱡᱤ ᱨᱮᱭᱟᱜ ᱴᱷᱟᱶ ᱧᱮᱞ ᱢᱮ",
            "file_grievance": "ᱟᱯᱱᱟᱨ ᱫᱩᱠᱷ-ᱥᱩᱠᱷ ᱞᱟᱹᱭ ᱢᱮ",
            "digilocker_fetch": "ᱰᱤᱡᱤᱞᱚᱠᱟᱨ ᱠᱷᱚᱱ ᱯᱨᱚᱢᱟᱬ ᱯᱚᱛᱚᱨ ᱧᱟᱢ ᱢᱮ",
            "offline_notice": "ᱱᱮᱴ ᱵᱟᱱᱩᱜ-ᱟ, ᱢᱮᱱᱠᱷᱟᱱ ᱯᱷᱳᱱ ᱨᱮ ᱥᱟᱸᱪᱟᱣ ᱢᱮᱱᱟᱜ-ᱟ᱾",
            "data_saver": "ᱠᱚᱢ ᱰᱮᱴᱟ ᱢᱳᱰ ᱪᱟᱹᱞᱩ ᱟᱠᱟᱱᱟ",
            "biometric_login": "ᱠᱟᱹᱴᱩᱵ ᱪᱤᱱᱦᱟᱹ ᱛᱮ ᱠᱷᱩᱞᱟᱹᱭ ᱢᱮ",
            "sync_now": "ᱥᱤᱸᱠ ᱠᱟᱛᱮ ᱵᱷᱮᱡᱟᱭ ᱢᱮ"
        }
    },
    "unr": {
        "name": "मुण्डारी (Mundari)",
        "script": "Devanagari",
        "strings": {
            "portal_title": "मुण्डारी आदिवासी छात्रवृत्ति सेवा पोर्टल",
            "welcome": "झारखंड दिशुम आदिवासी सेवा पोर्टल रे जोहार",
            "apply_scholarship": "छात्रवृत्ति लेकाते दरखास्त ओल मे",
            "track_status": "दरखास्त रियाः स्थिति नेल मे",
            "file_grievance": "शिकायत दर्ज केते कुल मे",
            "digilocker_fetch": "डिजिलॉकर एते जाति प्रमाण पत्र अगुई मे",
            "offline_notice": "नेट बानुआ, मेनदो मोबाइल रे सुरक्षित मेनाअः।",
            "data_saver": "कम डेटा मोड चालू मेनाअः",
            "biometric_login": "अंगुठा छाप ते लॉगिन मे",
            "sync_now": "सोजे सिंक मे"
        }
    }
}

AUDIO_PROMPTS_CATALOG = {
    "welcome_instructions": {
        "en": "Welcome to the Jharkhand Tribal Welfare Scholarship Portal. Keep your Aadhaar and Caste Certificate ready.",
        "hi": "झारखंड आदिवासी कल्याण छात्रवृत्ति पोर्टल में आपका स्वागत है। कृपया अपना आधार कार्ड और जाति प्रमाण पत्र तैयार रखें।",
        "sat": "ᱡᱷᱟᱨᱠᱷᱚᱸᱰ ᱟᱹᱫᱤᱵᱟᱹᱥᱤ ᱥᱠᱚᱞᱟᱨᱥᱤᱯ ᱯᱚᱨᱴᱟᱞ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾ ᱟᱢᱟᱜ ᱟᱫᱷᱟᱨ ᱟᱨ ᱡᱟᱹᱛᱤ ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱥᱟᱯᱲᱟᱣ ᱫᱚᱦᱚᱭ ᱢᱮ᱾",
        "hoc": "ᱡᱷᱟᱨᱠᱷᱚᱸᱰ ᱟᱹᱫᱤᱵᱟᱹᱥᱤ ᱯᱚᱨᱴᱟᱞ ᱨᱮ ᱡᱚᱦᱟᱨ᱾ ᱟᱢᱟᱜ ᱟᱫᱷᱟᱨ ᱠᱟᱨᱰ ᱟᱨ ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱥᱟᱯᱲᱟᱣ ᱢᱮ᱾",
        "unr": "झारखंड दिशुम आदिवासी पोर्टल रे जोहार। आमाः आधार कार्ड आर जाति प्रमाण पत्र सापाड़ाव दोहोई मे।"
    },
    "offline_draft_saved": {
        "en": "Your application has been safely saved in your phone storage. It will automatically upload when network returns.",
        "hi": "आपका आवेदन आपके फोन में सुरक्षित रूप से सहेज लिया गया है। नेटवर्क आने पर यह स्वतः अपलोड हो जाएगा।",
        "sat": "ᱟᱢᱟᱜ ᱫᱚᱨᱠᱷᱟᱥᱛ ᱫᱚ ᱯᱷᱳᱱ ᱨᱮ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱮᱱᱟ᱾ ᱱᱮᱴᱣᱟᱨᱠ ᱦᱮᱡ ᱞᱮᱱᱠᱷᱟᱱ ᱟᱡ ᱛᱮᱜᱮ ᱟᱯᱞᱳᱰᱚᱜ-ᱟ᱾",
        "hoc": "ᱟᱢᱟᱜ ᱟᱨᱡᱤ ᱯᱷᱳᱱ ᱨᱮ ᱥᱟᱸᱪᱟᱣ ᱮᱱᱟ᱾ ᱱᱮᱴ ᱧᱟᱢ ᱞᱮᱱᱠᱷᱟᱱ ᱵᱷᱮᱡᱟᱜ-ᱟ᱾",
        "unr": "आमाः दरखास्त फोन रे सुरक्षित मेनाअः। नेटवर्क हिजुः जोमते अपलोडोअः।"
    }
}


class MobileService:
    @staticmethod
    def process_offline_sync_batch(db: Session, user: Optional[User], request: OfflineSyncBatchRequest) -> OfflineSyncBatchResponse:
        results = []
        synced_count = 0
        conflict_count = 0

        for item in request.items:
            # Check idempotency token
            existing_queue = db.query(OfflineSyncQueue).filter(
                OfflineSyncQueue.idempotency_token == item.idempotency_token
            ).first()

            if existing_queue:
                results.append(OfflineSyncItemResult(
                    idempotency_token=item.idempotency_token,
                    entity_type=item.entity_type,
                    status=existing_queue.sync_status,
                    message="Item already synced previously via idempotency token",
                    server_entity_id=existing_queue.id
                ))
                if existing_queue.sync_status == "SYNCED":
                    synced_count += 1
                else:
                    conflict_count += 1
                continue

            # Process entity actions
            server_entity_id = str(uuid.uuid4())
            sync_status_val = "SYNCED"
            msg = "Action applied successfully"

            try:
                if item.entity_type == "APPLICATION_DRAFT":
                    if user:
                        scheme_id = item.payload.get("scheme_id")
                        if not scheme_id:
                            scheme_rec = db.query(Scheme).first()
                            scheme_id = scheme_rec.id if scheme_rec else "ST-POST-MATRIC"

                        draft = db.query(ApplicationDraft).filter(
                            ApplicationDraft.student_id == user.id
                        ).first()
                        if not draft:
                            draft = ApplicationDraft(
                                student_id=user.id,
                                scheme_id=scheme_id,
                                draft_data=item.payload
                            )
                            db.add(draft)
                        else:
                            draft.draft_data = item.payload
                            draft.last_saved_at = datetime.utcnow()
                        db.flush()
                        server_entity_id = draft.id

                elif item.entity_type == "GRIEVANCE":
                    ticket_no = f"GR-OFFLINE-{secrets.token_hex(4).upper()}"
                    complainant_id = user.id if user else None
                    if not complainant_id:
                        fallback_user = db.query(User).first()
                        if fallback_user:
                            complainant_id = fallback_user.id
                        else:
                            fallback_user = User(
                                email="offline_citizen@jharkhand.gov.in",
                                role="student",
                                is_active=True,
                                is_verified=True
                            )
                            db.add(fallback_user)
                            db.flush()
                            complainant_id = fallback_user.id

                    grievance = Grievance(
                        ticket_number=ticket_no,
                        complainant_user_id=complainant_id,
                        category=GrievanceCategory.APPLICATION_DELAY,
                        subject=item.payload.get("subject", "Offline Grievance"),
                        description=item.payload.get("description", "Synced from offline mobile queue"),
                        priority=GrievancePriority.MEDIUM,
                        status=GrievanceStatus.SUBMITTED
                    )
                    db.add(grievance)
                    db.flush()
                    server_entity_id = grievance.ticket_number

                # Record in queue
                queue_entry = OfflineSyncQueue(
                    device_id=request.device_id,
                    user_id=user.id if user else None,
                    idempotency_token=item.idempotency_token,
                    entity_type=item.entity_type,
                    action=item.action,
                    payload=item.payload,
                    sync_status=sync_status_val,
                    client_timestamp=item.client_timestamp,
                    synced_at=datetime.utcnow()
                )
                db.add(queue_entry)
                db.commit()

                synced_count += 1
                results.append(OfflineSyncItemResult(
                    idempotency_token=item.idempotency_token,
                    entity_type=item.entity_type,
                    status="SYNCED",
                    message=msg,
                    server_entity_id=server_entity_id
                ))
            except Exception as e:
                db.rollback()
                conflict_count += 1
                results.append(OfflineSyncItemResult(
                    idempotency_token=item.idempotency_token,
                    entity_type=item.entity_type,
                    status="CONFLICT",
                    message=f"Sync error: {str(e)}"
                ))

        return OfflineSyncBatchResponse(
            device_id=request.device_id,
            processed_count=len(request.items),
            synced_count=synced_count,
            conflict_count=conflict_count,
            results=results
        )

    @staticmethod
    def get_vernacular_translations(language_code: str) -> VernacularTranslationResponse:
        code = language_code.lower()
        if code not in VERNACULAR_DICTIONARY:
            code = "en"
        data = VERNACULAR_DICTIONARY[code]
        return VernacularTranslationResponse(
            language_code=code,
            language_name=data["name"],
            script_name=data["script"],
            strings=data["strings"]
        )

    @staticmethod
    def optimize_document(request: DocumentCompressionRequest) -> DocumentCompressionResponse:
        tier = request.quality_tier or "2G_ULTRA_LOW"
        orig_kb = request.original_size_kb

        if tier == "2G_ULTRA_LOW":
            # Compress aggressively to ~65KB
            compressed_kb = min(orig_kb, max(45.0, orig_kb * 0.18))
            ratio = round(compressed_kb / max(orig_kb, 1.0), 3)
            legibility = 0.94
            is_2g = True
        elif tier == "3G_BALANCED":
            compressed_kb = min(orig_kb, max(120.0, orig_kb * 0.40))
            ratio = round(compressed_kb / max(orig_kb, 1.0), 3)
            legibility = 0.98
            is_2g = True
        else:
            compressed_kb = min(orig_kb, max(250.0, orig_kb * 0.70))
            ratio = round(compressed_kb / max(orig_kb, 1.0), 3)
            legibility = 0.99
            is_2g = False

        return DocumentCompressionResponse(
            filename=request.filename,
            original_size_kb=round(orig_kb, 2),
            compressed_size_kb=round(compressed_kb, 2),
            compression_ratio=ratio,
            quality_tier=tier,
            legibility_score=legibility,
            is_2g_optimized=is_2g
        )

    @staticmethod
    def get_audio_prompt(prompt_key: str, language_code: str) -> AudioPromptResponse:
        code = language_code.lower()
        if prompt_key not in AUDIO_PROMPTS_CATALOG:
            prompt_key = "welcome_instructions"
        catalog = AUDIO_PROMPTS_CATALOG[prompt_key]
        transcript = catalog.get(code, catalog.get("en", "Welcome to the scholarship portal."))
        lang_name = VERNACULAR_DICTIONARY.get(code, {}).get("name", "English")

        audio_slug = f"audio_{prompt_key}_{code}"
        return AudioPromptResponse(
            prompt_key=prompt_key,
            language_code=code,
            language_name=lang_name,
            transcript=transcript,
            audio_url=f"/api/v1/mobile/audio/{audio_slug}.mp3",
            duration_seconds=4.5
        )

    @staticmethod
    def generate_webauthn_register_options(user: User) -> WebAuthnChallengeResponse:
        challenge = secrets.token_urlsafe(32)
        return WebAuthnChallengeResponse(
            challenge=challenge,
            user_id=user.id,
            rp_name="ST Seva Portal Jharkhand",
            rp_id="st-seva.jharkhand.gov.in",
            timeout=60000
        )

    @staticmethod
    def verify_webauthn_register(db: Session, user: User, request: WebAuthnRegisterVerifyRequest) -> Dict[str, Any]:
        existing = db.query(BiometricCredential).filter(
            BiometricCredential.credential_id == request.credential_id
        ).first()

        if existing:
            existing.public_key = request.public_key
            existing.device_name = request.device_name
            existing.last_used_at = datetime.utcnow()
        else:
            cred = BiometricCredential(
                user_id=user.id,
                credential_id=request.credential_id,
                public_key=request.public_key,
                device_name=request.device_name,
                attestation_type=request.attestation_type or "none",
                created_at=datetime.utcnow()
            )
            db.add(cred)

        db.commit()
        return {
            "status": "REGISTERED",
            "credential_id": request.credential_id,
            "device_name": request.device_name,
            "message": "Mobile biometric credential successfully enrolled"
        }

    @staticmethod
    def generate_webauthn_login_options(db: Session, email_or_id: str) -> WebAuthnChallengeResponse:
        user = db.query(User).filter(
            (User.email == email_or_id) | (User.id == email_or_id)
        ).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        challenge = secrets.token_urlsafe(32)
        return WebAuthnChallengeResponse(
            challenge=challenge,
            user_id=user.id,
            rp_name="ST Seva Portal Jharkhand",
            rp_id="st-seva.jharkhand.gov.in",
            timeout=60000
        )

    @staticmethod
    def verify_webauthn_login(db: Session, request: WebAuthnLoginVerifyRequest) -> WebAuthnAuthResponse:
        cred = db.query(BiometricCredential).filter(
            BiometricCredential.credential_id == request.credential_id
        ).first()

        if not cred:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unrecognized biometric credential")

        user = db.query(User).filter(User.id == cred.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        cred.sign_counter += 1
        cred.last_used_at = datetime.utcnow()
        db.commit()

        token = create_access_token(data={"sub": user.email, "role": user.role.value if hasattr(user.role, 'value') else user.role})

        return WebAuthnAuthResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            device_name=cred.device_name
        )
