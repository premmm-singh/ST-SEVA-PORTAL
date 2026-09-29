import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Date,
    Text,
    ForeignKey,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base


class AllocationCycleStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SIMULATED = "SIMULATED"
    OBJECTION_WINDOW = "OBJECTION_WINDOW"
    FINALIZED = "FINALIZED"


class AllocationResultStatus(str, enum.Enum):
    SELECTED = "SELECTED"
    WAITLISTED = "WAITLISTED"
    DROPPED = "DROPPED"
    SWITCHED_SCHEME = "SWITCHED_SCHEME"
    REJECTED = "REJECTED"
    BUDGET_EXCEEDED = "BUDGET_EXCEEDED"


class QuotaCategory(str, enum.Enum):
    GENERAL_ST = "GENERAL_ST"
    FEMALE_33 = "FEMALE_33"
    PVTG_5 = "PVTG_5"
    PWD_5 = "PWD_5"
    SPORTS_2 = "SPORTS_2"
    NONE = "NONE"


class ObjectionType(str, enum.Enum):
    MARKS_DISCREPANCY = "MARKS_DISCREPANCY"
    INCOME_TIER_ERROR = "INCOME_TIER_ERROR"
    PVTG_QUOTA_MISSED = "PVTG_QUOTA_MISSED"
    PWD_QUOTA_MISSED = "PWD_QUOTA_MISSED"
    TIE_BREAKER_DISPUTE = "TIE_BREAKER_DISPUTE"
    OTHER = "OTHER"


class ObjectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class AllocationCycle(Base):
    __tablename__ = "allocation_cycles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_id = Column(String(36), ForeignKey("schemes.id"), nullable=False, index=True)
    academic_year = Column(String(20), nullable=False, default="2026-2027")
    financial_year = Column(String(20), nullable=False, default="2026-2027")
    total_budget = Column(Float, nullable=False, default=5000000.0)  # e.g., 50 Lakhs
    allocated_budget = Column(Float, nullable=False, default=0.0)
    total_seats = Column(Integer, nullable=False, default=100)
    status = Column(SQLEnum(AllocationCycleStatus), default=AllocationCycleStatus.DRAFT, nullable=False)
    objection_deadline = Column(DateTime, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    scheme = relationship("Scheme")
    creator = relationship("User", foreign_keys=[created_by])
    merit_scores = relationship("MeritScore", back_populates="allocation_cycle", cascade="all, delete-orphan")
    results = relationship("AllocationResult", back_populates="allocation_cycle", cascade="all, delete-orphan")
    objections = relationship("MeritObjection", back_populates="allocation_cycle", cascade="all, delete-orphan")
    sanction_orders = relationship("SanctionOrder", back_populates="allocation_cycle", cascade="all, delete-orphan")
    audit_logs = relationship("AllocationAuditLog", back_populates="allocation_cycle", cascade="all, delete-orphan")


class MeritScore(Base):
    __tablename__ = "merit_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    allocation_cycle_id = Column(String(36), ForeignKey("allocation_cycles.id"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    
    academic_score = Column(Float, nullable=False, default=0.0)  # Max 60 pts
    income_score = Column(Float, nullable=False, default=0.0)    # Max 25 pts (inverse income)
    pvtg_bonus = Column(Float, nullable=False, default=0.0)      # +15 pts for PVTG
    total_merit_score = Column(Float, nullable=False, default=0.0)  # Total out of 100
    
    # Tie-breaking auxiliary criteria
    core_subject_marks = Column(Float, nullable=False, default=0.0)
    family_income = Column(Float, nullable=False, default=0.0)
    dob = Column(Date, nullable=True)
    submission_timestamp = Column(DateTime, nullable=True)
    
    # Reservation and quota markers
    pvtg_community = Column(String(100), nullable=True)
    is_female = Column(Boolean, default=False, nullable=False)
    is_pwd = Column(Boolean, default=False, nullable=False)
    is_sports = Column(Boolean, default=False, nullable=False)
    district = Column(String(100), nullable=True)
    
    # Rankings
    rank_overall = Column(Integer, nullable=True)
    rank_district = Column(Integer, nullable=True)
    rank_category = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    allocation_cycle = relationship("AllocationCycle", back_populates="merit_scores")
    application = relationship("Application")


class AllocationResult(Base):
    __tablename__ = "allocation_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    allocation_cycle_id = Column(String(36), ForeignKey("allocation_cycles.id"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    status = Column(SQLEnum(AllocationResultStatus), default=AllocationResultStatus.WAITLISTED, nullable=False)
    quota_category = Column(SQLEnum(QuotaCategory), default=QuotaCategory.NONE, nullable=False)
    
    allocated_amount = Column(Float, nullable=False, default=0.0)
    maintenance_allowance = Column(Float, nullable=False, default=0.0)
    tuition_reimbursement = Column(Float, nullable=False, default=0.0)
    
    waitlist_number = Column(Integer, nullable=True)
    sanction_order_number = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    allocation_cycle = relationship("AllocationCycle", back_populates="results")
    application = relationship("Application")
    student = relationship("User")


class MeritObjection(Base):
    __tablename__ = "merit_objections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    allocation_cycle_id = Column(String(36), ForeignKey("allocation_cycles.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    
    objection_type = Column(SQLEnum(ObjectionType), default=ObjectionType.OTHER, nullable=False)
    description = Column(Text, nullable=False)
    claimed_score = Column(Float, nullable=True)
    supporting_doc_url = Column(String(500), nullable=True)
    
    status = Column(SQLEnum(ObjectionStatus), default=ObjectionStatus.PENDING, nullable=False)
    resolution_remarks = Column(Text, nullable=True)
    resolved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    allocation_cycle = relationship("AllocationCycle", back_populates="objections")
    student = relationship("User", foreign_keys=[student_id])
    application = relationship("Application")
    resolver = relationship("User", foreign_keys=[resolved_by])


class SanctionOrder(Base):
    __tablename__ = "sanction_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String(100), unique=True, nullable=False, index=True)
    allocation_cycle_id = Column(String(36), ForeignKey("allocation_cycles.id"), nullable=False, index=True)
    scheme_id = Column(String(36), ForeignKey("schemes.id"), nullable=False, index=True)
    
    financial_year = Column(String(20), nullable=False, default="2026-2027")
    total_beneficiaries = Column(Integer, nullable=False, default=0)
    total_sanctioned_amount = Column(Float, nullable=False, default=0.0)
    digital_signature_hash = Column(String(64), nullable=False)  # SHA-256
    
    issued_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    pdf_path = Column(String(500), nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    allocation_cycle = relationship("AllocationCycle", back_populates="sanction_orders")
    scheme = relationship("Scheme")
    issuer = relationship("User", foreign_keys=[issued_by])


class AllocationAuditLog(Base):
    __tablename__ = "allocation_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    allocation_cycle_id = Column(String(36), ForeignKey("allocation_cycles.id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    details_json = Column(Text, nullable=True)
    performed_by = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    allocation_cycle = relationship("AllocationCycle", back_populates="audit_logs")
