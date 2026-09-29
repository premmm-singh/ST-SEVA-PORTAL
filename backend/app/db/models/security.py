import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class OtpVerification(Base):
    __tablename__ = "otp_verifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    identifier_hash = Column(String(64), index=True, nullable=False) # blind hash of phone or email
    purpose = Column(String(50), default="login") # login, registration, password_reset, recovery, mfa
    otp_code_hash = Column(String(64), nullable=False) # SHA-256 hash of 6-digit OTP
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class MfaCredential(Base):
    __tablename__ = "mfa_credentials"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    totp_secret_enc = Column(Text, nullable=False) # AES-256 encrypted base32 secret
    is_enabled = Column(Boolean, default=False)
    backup_codes_hash = Column(JSON, default=list) # SHA-256 hashes of emergency backup codes
    confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="mfa_credential")

class UserSecurityQuestion(Base):
    __tablename__ = "user_security_questions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_key = Column(String(100), nullable=False)
    answer_hash = Column(String(255), nullable=False) # salted bcrypt of normalized answer
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="security_questions")
