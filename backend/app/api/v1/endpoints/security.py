import io
import base64
import pyotp
import qrcode
import secrets
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.db.models.user import User, UserRole
from app.db.models.security import MfaCredential, UserSecurityQuestion
from app.db.models.audit import AuditLog
from app.core.crypto import encrypt_field, decrypt_field
from app.core.security import hash_password, verify_password
from app.core.audit import record_audit_log
from app.services.backup_service import BackupService
from app.schemas.security import (
    MfaSetupResponse, MfaEnableRequest, MfaEnableResponse, MfaDisableRequest,
    SetSecurityQuestionsRequest, AuditLogResponse, BackupStatusResponse
)

router = APIRouter()

@router.post("/mfa/setup", response_model=MfaSetupResponse)
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Feature 148: Generate RFC 6238 TOTP Secret and QR Code for Google Authenticator."""
    secret = pyotp.random_base32()
    label = current_user.email or f"scholar_{current_user.id[:8]}"
    issuer = "ST Seva Portal (Gov of India)"
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=label, issuer_name=issuer)
    
    # Generate QR Code image in memory
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(otpauth_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#003366", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    # Store or update pending secret in db
    mfa = db.query(MfaCredential).filter(MfaCredential.user_id == current_user.id).first()
    if not mfa:
        mfa = MfaCredential(
            user_id=current_user.id,
            totp_secret_enc=encrypt_field(secret),
            is_enabled=False
        )
        db.add(mfa)
    else:
        mfa.totp_secret_enc = encrypt_field(secret)
        mfa.is_enabled = False
        
    db.commit()
    
    return MfaSetupResponse(
        secret=secret,
        qr_code_base64=f"data:image/png;base64,{qr_base64}",
        otpauth_url=otpauth_url
    )

@router.post("/mfa/enable", response_model=MfaEnableResponse)
def enable_mfa(req: MfaEnableRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Feature 148: Verify TOTP code from app and activate MFA with 5 emergency backup codes."""
    mfa = db.query(MfaCredential).filter(MfaCredential.user_id == current_user.id).first()
    if not mfa:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA setup has not been initiated")
        
    secret = decrypt_field(mfa.totp_secret_enc)
    totp = pyotp.TOTP(secret)
    if not totp.verify(req.totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 6-digit TOTP code")
        
    # Generate 5 backup codes
    backup_codes = [f"{secrets.token_hex(4).upper()}" for _ in range(5)]
    hashed_backups = [hash_password(c) for c in backup_codes]
    
    mfa.is_enabled = True
    mfa.confirmed_at = datetime.now(timezone.utc)
    mfa.backup_codes_hash = hashed_backups
    db.commit()
    
    record_audit_log(
        db, action="MFA_ENABLED", resource_type="SECURITY",
        user_id=current_user.id, resource_id=mfa.id
    )
    
    return MfaEnableResponse(
        message="Two-Factor Authentication (TOTP) successfully activated",
        backup_codes=backup_codes
    )

@router.post("/mfa/disable")
def disable_mfa(req: MfaDisableRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Feature 148: Disable TOTP with security verification."""
    mfa = db.query(MfaCredential).filter(MfaCredential.user_id == current_user.id).first()
    if not mfa or not mfa.is_enabled:
        return {"message": "MFA is already disabled"}
        
    # Verify either password or totp
    verified = False
    if req.password and current_user.hashed_password and verify_password(req.password, current_user.hashed_password):
        verified = True
    elif req.totp_code:
        secret = decrypt_field(mfa.totp_secret_enc)
        if pyotp.TOTP(secret).verify(req.totp_code):
            verified = True
            
    if not verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification failed. Provide valid password or TOTP code.")
        
    mfa.is_enabled = False
    db.commit()
    
    record_audit_log(
        db, action="MFA_DISABLED", resource_type="SECURITY",
        user_id=current_user.id, resource_id=mfa.id
    )
    
    return {"message": "MFA successfully disabled."}

@router.post("/recovery/questions")
def set_recovery_questions(
    req: SetSecurityQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 12: Configure security questions for account recovery."""
    db.query(UserSecurityQuestion).filter(UserSecurityQuestion.user_id == current_user.id).delete()
    for q in req.questions:
        db.add(UserSecurityQuestion(
            user_id=current_user.id,
            question_key=q.question_key,
            answer_hash=hash_password(q.answer.strip().lower())
        ))
    db.commit()
    return {"message": f"{len(req.questions)} recovery questions saved."}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    """Feature 144: Query tamper-resistant audit logs with hash chaining."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
    return logs

@router.post("/backup/trigger")
def trigger_backup(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Feature 145 & 146: Trigger manual database backup snapshot."""
    res = BackupService.trigger_backup()
    record_audit_log(
        db, action="MANUAL_BACKUP_TRIGGERED", resource_type="SYSTEM",
        user_id=current_user.id, details=res
    )
    return res

@router.get("/backup/status", response_model=BackupStatusResponse)
def get_backup_status(current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Feature 145 & 146: Get backup health and documented RTO/RPO."""
    return BackupService.get_status()
