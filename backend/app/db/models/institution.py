import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, Float, Numeric, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class InstitutionMaster(Base):
    __tablename__ = "institution_master"
    
    aishe_code = Column(String(30), primary_key=True, index=True) # e.g. C-44281, U-0205
    udise_code = Column(String(30), index=True, nullable=True) # 11-digit school code
    name = Column(String(255), nullable=False, index=True)
    institution_type = Column(String(50), default="Higher Education") # Higher Education, School, University, Polytechnic
    affiliated_university = Column(String(255), nullable=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    address = Column(Text, nullable=True)
    pincode = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    profiles = relationship("InstitutionProfile", back_populates="master_institution")

class InstitutionProfile(Base):
    __tablename__ = "institution_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    aishe_code = Column(String(30), ForeignKey("institution_master.aishe_code"), nullable=False, index=True)
    nodal_officer_name = Column(String(150), nullable=False)
    nodal_officer_designation = Column(String(100), default="Institutional Nodal Officer (INO)")
    official_email = Column(String(255), nullable=False)
    contact_mobile = Column(String(20), nullable=False)
    verification_status = Column(String(30), default="APPROVED") # PENDING, APPROVED, SUSPENDED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="institution_profile")
    master_institution = relationship("InstitutionMaster", back_populates="profiles")
    fee_structures = relationship("InstitutionFeeStructure", back_populates="institution", cascade="all, delete-orphan")
    verifications = relationship("InstitutionVerification", back_populates="institution", cascade="all, delete-orphan")
    defect_notices = relationship("DefectNotice", back_populates="institution", cascade="all, delete-orphan")
    grievances = relationship("InstitutionGrievance", back_populates="institution", cascade="all, delete-orphan")

class InstitutionFeeStructure(Base):
    __tablename__ = "institution_fee_structures"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institution_profiles.id", ondelete="CASCADE"), nullable=False)
    course_name = Column(String(150), nullable=False)
    academic_year = Column(String(20), default="2026-2027")
    tuition_fee = Column(Numeric(10, 2), default=0.0)
    admission_fee = Column(Numeric(10, 2), default=0.0)
    exam_fee = Column(Numeric(10, 2), default=0.0)
    library_fee = Column(Numeric(10, 2), default=0.0)
    hostel_fee = Column(Numeric(10, 2), default=0.0)
    total_annual_fee = Column(Numeric(10, 2), default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("InstitutionProfile", back_populates="fee_structures")

class InstitutionVerification(Base):
    __tablename__ = "institution_verifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    institution_id = Column(String(36), ForeignKey("institution_profiles.id", ondelete="CASCADE"), nullable=False)
    verified_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Bonafide & Enrollment checks
    bonafide_confirmed = Column(Boolean, default=True, nullable=False)
    roll_number = Column(String(50), nullable=True)
    admission_year = Column(Integer, nullable=True)
    
    # Attendance validation (75% rule)
    attendance_percentage = Column(Float, nullable=False)
    attendance_compliant = Column(Boolean, default=True, nullable=False) # True if >= 75.0 or permitted exemption
    attendance_remarks = Column(Text, nullable=True)
    
    # Hostel residency
    is_hosteller = Column(Boolean, default=False, nullable=False)
    hostel_name = Column(String(150), nullable=True)
    hostel_room_no = Column(String(50), nullable=True)
    
    # Fee structure validation
    fee_claimed = Column(Numeric(10, 2), nullable=True)
    fee_approved = Column(Numeric(10, 2), nullable=True)
    fee_status = Column(String(30), default="MATCH") # MATCH, MISMATCH, ADJUSTED
    
    # Academic performance
    academic_verified = Column(Boolean, default=True, nullable=False)
    previous_year_percentage = Column(Float, nullable=True)
    cgpa = Column(Float, nullable=True)
    has_uncleared_backlogs = Column(Boolean, default=False, nullable=False)
    
    # Outcome and Digital Stamp
    verification_status = Column(String(30), default="VERIFIED_AND_FORWARDED") # VERIFIED_AND_FORWARDED, DEFECTIVE, REJECTED
    remarks = Column(Text, nullable=True)
    digital_stamp = Column(String(128), nullable=False) # SHA-256 seal of INO + decision
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("InstitutionProfile", back_populates="verifications")
    application = relationship("Application", backref="institution_verification")
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])

class DefectNotice(Base):
    __tablename__ = "defect_notices"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    institution_id = Column(String(36), ForeignKey("institution_profiles.id", ondelete="CASCADE"), nullable=False)
    defect_category = Column(String(100), nullable=False) # INCORRECT_FEE, LOW_ATTENDANCE, UNCLEAR_MARK_SHEET, etc.
    defect_description = Column(Text, nullable=False)
    correction_deadline = Column(DateTime, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("InstitutionProfile", back_populates="defect_notices")
    application = relationship("Application", backref="defect_notices")

class InstitutionGrievance(Base):
    __tablename__ = "institution_grievances"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institution_profiles.id", ondelete="CASCADE"), nullable=False)
    ticket_number = Column(String(30), unique=True, index=True, nullable=False) # GRV-INST-2026-XXXXX
    category = Column(String(100), nullable=False) # QUOTA_INQUIRY, FEE_REIMBURSEMENT, PORTAL_BUG, STUDENT_DISPUTE
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="OPEN") # OPEN, IN_REVIEW, RESOLVED, CLOSED
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    response_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("InstitutionProfile", back_populates="grievances")
