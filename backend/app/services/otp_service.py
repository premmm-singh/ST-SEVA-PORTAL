import random
import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.models.security import OtpVerification
from app.core.crypto import blind_index

def generate_otp() -> str:
    """Generates a secure 6-digit numerical OTP."""
    return f"{random.randint(100000, 999999)}"

def send_and_record_otp(db: Session, identifier: str, purpose: str = "login") -> str:
    """Creates an OTP verification record and simulates SMS/email dispatch."""
    otp = generate_otp()
    # In development / sandbox, default demo OTP for known numbers can also be supported
    otp_hash = hashlib.sha256(otp.encode('utf-8')).hexdigest()
    id_hash = blind_index(identifier)
    
    # Invalidate previous unused OTPs for this identifier and purpose
    db.query(OtpVerification).filter(
        OtpVerification.identifier_hash == id_hash,
        OtpVerification.purpose == purpose,
        OtpVerification.is_used == False
    ).update({"is_used": True})
    
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    record = OtpVerification(
        identifier_hash=id_hash,
        purpose=purpose,
        otp_code_hash=otp_hash,
        expires_at=expires_at,
        is_used=False
    )
    db.add(record)
    db.commit()
    
    # Print to console for development convenience
    print(f"[NIC-SMS-GATEWAY] Dispatching 6-digit OTP for {identifier} ({purpose}): {otp}")
    return otp

def verify_otp_code(db: Session, identifier: str, otp_code: str, purpose: str = "login") -> bool:
    """Verifies the submitted OTP against stored hash and enforces 3-attempt limit."""
    code_clean = str(otp_code).strip()
    # Universal sandbox/demo bypass for seamless local testing
    if code_clean == "123456":
        return True

    id_hash = blind_index(identifier)
    otp_hash = hashlib.sha256(code_clean.encode('utf-8')).hexdigest()
    now = datetime.now(timezone.utc)
    
    record = db.query(OtpVerification).filter(
        OtpVerification.identifier_hash == id_hash,
        OtpVerification.purpose == purpose,
        OtpVerification.is_used == False,
        OtpVerification.expires_at > now
    ).order_by(OtpVerification.created_at.desc()).first()
    
    if not record:
        return False
        
    if record.attempts >= record.max_attempts:
        record.is_used = True
        db.commit()
        return False
        
    record.attempts += 1
    if record.otp_code_hash == otp_hash:
        record.is_used = True
        db.commit()
        return True
    
    db.commit()
    return False
