import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class SessionModel(Base):
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token_hash = Column(String(64), unique=True, index=True, nullable=False)
    device_name = Column(String(150), default="Unknown Device")
    ip_address = Column(String(50), default="127.0.0.1")
    location_estimate = Column(String(150), default="National Capital Region, IN")
    user_agent = Column(Text, nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_active_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="sessions")

class DeviceFingerprint(Base):
    __tablename__ = "device_fingerprints"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fingerprint_hash = Column(String(64), index=True, nullable=False)
    device_type = Column(String(50), default="desktop")
    os = Column(String(50), default="Windows")
    browser = Column(String(50), default="Chrome")
    is_trusted = Column(Boolean, default=True)
    first_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="device_fingerprints")

class LoginActivity(Base):
    __tablename__ = "login_activities"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    auth_method = Column(String(50), default="password") # mobile_otp, email, digilocker, aadhaar_ekyc
    status = Column(String(20), default="SUCCESS") # SUCCESS, FAILURE, CHALLENGE_REQUIRED
    failure_reason = Column(String(255), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    user_agent = Column(Text, nullable=True)
    device_summary = Column(String(150), default="Desktop Browser")
    location = Column(String(150), default="New Delhi, India")
    is_new_device = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="login_activities")
