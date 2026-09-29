import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, Float, Numeric, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class ScrutinyAction(Base):
    __tablename__ = "scrutiny_actions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    officer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Feature 48: Multi-level scrutiny workflow
    # L1_SCRUTINY: Scrutiny Assistant / Field Inspector
    # L2_VERIFICATION: District Welfare Officer (DWO)
    # L3_SANCTION: State Welfare Directorate / Sanctioning Authority
    scrutiny_level = Column(String(30), nullable=False)
    decision = Column(String(30), nullable=False) # RECOMMENDED, APPROVED, DEFICIENT, REJECTED, SANCTIONED
    
    # Feature 58: Mandatory statutory verification checklist
    caste_verified = Column(Boolean, default=True, nullable=False)
    income_verified = Column(Boolean, default=True, nullable=False)
    domicile_verified = Column(Boolean, default=True, nullable=False)
    bonafide_verified = Column(Boolean, default=True, nullable=False)
    dbt_eligible = Column(Boolean, default=True, nullable=False)
    duplicate_check_passed = Column(Boolean, default=True, nullable=False)
    
    remarks = Column(Text, nullable=True)
    digital_signature_hash = Column(String(128), nullable=False) # Immutable SHA-256 seal of officer + decision
    action_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", backref="scrutiny_actions")
    officer = relationship("User", foreign_keys=[officer_id])

class DuplicateFlag(Base):
    __tablename__ = "duplicate_flags"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    matched_application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Feature 53: Duplicate application detection
    match_type = Column(String(50), nullable=False) # AADHAAR, BANK_ACCOUNT, MOBILE, IDENTITY_FUZZY
    confidence_score = Column(Float, default=100.0, nullable=False) # 0.0 to 100.0
    match_details = Column(Text, nullable=False)
    
    is_cleared = Column(Boolean, default=False, nullable=False)
    cleared_by_officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    cleared_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", foreign_keys=[application_id], backref="duplicate_flags")
    matched_application = relationship("Application", foreign_keys=[matched_application_id])
    cleared_by = relationship("User", foreign_keys=[cleared_by_officer_id])

class PhysicalInspection(Base):
    __tablename__ = "physical_inspections"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    inspector_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Feature 56: Physical spot inspection report
    institution_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_address = Column(Text, nullable=True)
    student_present = Column(Boolean, default=True, nullable=False)
    hostel_room_verified = Column(Boolean, default=False, nullable=False)
    inspection_summary = Column(Text, nullable=False)
    photo_url = Column(Text, nullable=True)
    inspected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", backref="physical_inspections")
    inspector = relationship("User", foreign_keys=[inspector_id])

class DiscrepancyFlag(Base):
    __tablename__ = "discrepancy_flags"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Feature 57: Discrepancy flagging & Risk tagging
    risk_level = Column(String(20), default="GREEN", nullable=False) # GREEN, AMBER, RED
    rule_code = Column(String(50), nullable=False) # e.g. DUP_AADHAAR, EXP_INCOME, SUBCASTE_MISMATCH, UNVERIFIED_DOC
    description = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", backref="discrepancy_flags")
