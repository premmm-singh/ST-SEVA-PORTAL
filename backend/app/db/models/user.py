import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    OFFICER = "officer"
    INSTITUTION = "institution"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mobile_number_hash = Column(String(64), unique=True, index=True, nullable=True)
    mobile_number_enc = Column(Text, nullable=True) # AES-256 encrypted
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Aadhaar blind hash and AES-encrypted UIDAI token
    aadhaar_hash = Column(String(64), unique=True, index=True, nullable=True)
    aadhaar_enc = Column(Text, nullable=True)
    digilocker_id = Column(String(128), unique=True, index=True, nullable=True)
    
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    sessions = relationship("SessionModel", back_populates="user", cascade="all, delete-orphan")
    login_activities = relationship("LoginActivity", back_populates="user", cascade="all, delete-orphan")
    device_fingerprints = relationship("DeviceFingerprint", back_populates="user", cascade="all, delete-orphan")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    officer_profile = relationship("OfficerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    institution_profile = relationship("InstitutionProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mfa_credential = relationship("MfaCredential", back_populates="user", uselist=False, cascade="all, delete-orphan")
    security_questions = relationship("UserSecurityQuestion", back_populates="user", cascade="all, delete-orphan")
