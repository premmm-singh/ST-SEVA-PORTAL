from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.api.deps import get_current_user, get_current_user_optional
from app.services.mobile_service import MobileService
from app.schemas.mobile import (
    OfflineSyncBatchRequest,
    OfflineSyncBatchResponse,
    VernacularTranslationResponse,
    DocumentCompressionRequest,
    DocumentCompressionResponse,
    AudioPromptResponse,
    WebAuthnRegisterOptionsRequest,
    WebAuthnChallengeResponse,
    WebAuthnRegisterVerifyRequest,
    WebAuthnLoginVerifyRequest,
    WebAuthnAuthResponse
)

router = APIRouter()

# F-140: Offline Application Draft Save & IndexedDB/Local Queue Sync Engine
@router.post("/sync/offline-batch", response_model=OfflineSyncBatchResponse)
def sync_offline_batch(
    request: OfflineSyncBatchRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Sync an offline client batch containing drafts, grievances, or documents."""
    return MobileService.process_offline_sync_batch(db, current_user, request)

# F-141: Vernacular Multi-Language Engine (English, Hindi, Santhali/Ol Chiki, Ho, Mundari)
@router.get("/i18n/translations", response_model=VernacularTranslationResponse)
def get_translations(
    lang: str = Query("en", description="Language code: en, hi, sat, hoc, unr")
):
    """Retrieve UI string translations for tribal vernacular languages."""
    return MobileService.get_vernacular_translations(lang)

# F-142: Low-Bandwidth 2G/3G Optimization & Adaptive Compression
@router.post("/optimize/document", response_model=DocumentCompressionResponse)
def optimize_document(
    request: DocumentCompressionRequest
):
    """Adaptive compression of heavy images or PDFs for rural 2G/3G cellular networks."""
    return MobileService.optimize_document(request)

# F-143: Screen Reader WCAG 2.1 AA Compliance & Voice Assist Audio Prompts
@router.get("/accessibility/audio-prompt", response_model=AudioPromptResponse)
def get_audio_prompt(
    key: str = Query("welcome_instructions", description="Audio prompt key"),
    lang: str = Query("hi", description="Language code: en, hi, sat, hoc, unr")
):
    """Synthesized voice audio prompt guidance for illiterate or visually challenged applicants."""
    return MobileService.get_audio_prompt(key, lang)

# F-144: Mobile Device Biometric Auth (WebAuthn / FIDO2 Passkeys)
@router.post("/auth/webauthn/register-options", response_model=WebAuthnChallengeResponse)
def webauthn_register_options(
    request: WebAuthnRegisterOptionsRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate WebAuthn / FIDO2 registration challenge for biometric enrollment."""
    return MobileService.generate_webauthn_register_options(current_user)

@router.post("/auth/webauthn/register-verify")
def webauthn_register_verify(
    request: WebAuthnRegisterVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify and enroll mobile biometric sensor credential (fingerprint/face)."""
    return MobileService.verify_webauthn_register(db, current_user, request)

@router.post("/auth/webauthn/login-options", response_model=WebAuthnChallengeResponse)
def webauthn_login_options(
    email: str = Query(..., description="User email or identifier"),
    db: Session = Depends(get_db)
):
    """Generate WebAuthn login challenge."""
    return MobileService.generate_webauthn_login_options(db, email)

@router.post("/auth/webauthn/login-verify", response_model=WebAuthnAuthResponse)
def webauthn_login_verify(
    request: WebAuthnLoginVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify cryptographic device signature and yield portal JWT access token."""
    return MobileService.verify_webauthn_login(db, request)
