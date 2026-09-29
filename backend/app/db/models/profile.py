import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    dob = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True) # Male, Female, Other
    category = Column(String(50), default="Scheduled Tribe (ST)")
    sub_caste = Column(String(100), nullable=True)
    father_name = Column(String(150), nullable=True)
    mother_name = Column(String(150), nullable=True)
    annual_family_income = Column(Numeric(12, 2), nullable=True)
    
    # Address
    address_line1 = Column(Text, nullable=True)
    address_line2 = Column(Text, nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    # Bank Details [AES-256 for Account Number]
    bank_name = Column(String(100), nullable=True)
    bank_account_enc = Column(Text, nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    bank_branch = Column(String(100), nullable=True)
    
    # Academic & AISHE Institute
    institution_name = Column(String(200), nullable=True)
    institution_code_aishe = Column(String(50), nullable=True)
    course_name = Column(String(100), nullable=True)
    current_year_of_study = Column(Integer, nullable=True)
    
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="student_profile")

class OfficerProfile(Base):
    __tablename__ = "officer_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    designation = Column(String(100), default="District Welfare Officer (DWO)")
    department = Column(String(150), default="Tribal Welfare Department")
    state = Column(String(100), default="Jharkhand")
    district = Column(String(100), default="Ranchi")
    office_address = Column(Text, nullable=True)
    employee_id = Column(String(50), unique=True, nullable=True)
    assigned_schemes = Column(JSON, default=lambda: ["ST_PRE_MATRIC", "ST_POST_MATRIC", "NATIONAL_FELLOWSHIP_ST"])
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="officer_profile")

class AdminProfile(Base):
    __tablename__ = "admin_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    admin_level = Column(String(50), default="NATIONAL_ADMIN") # STATE_ADMIN, NATIONAL_ADMIN, SUPER_ADMIN
    jurisdiction = Column(String(100), default="Ministry of Tribal Affairs, New Delhi")
    contact_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="admin_profile")
