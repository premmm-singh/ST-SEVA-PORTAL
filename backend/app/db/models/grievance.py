import enum
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Text
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class GrievanceCategory(str, enum.Enum):
    APPLICATION_DELAY = "APPLICATION_DELAY"
    SCRUTINY_REJECTION = "SCRUTINY_REJECTION"
    DISBURSEMENT_FAILURE = "DISBURSEMENT_FAILURE"
    INSTITUTION_HARASSMENT = "INSTITUTION_HARASSMENT"
    TECHNICAL_GLITCH = "TECHNICAL_GLITCH"
    OTHER = "OTHER"

class GrievanceStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    HEARING_SCHEDULED = "HEARING_SCHEDULED"
    ESCALATED_L2 = "ESCALATED_L2"
    ESCALATED_L3 = "ESCALATED_L3"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    APPEALED = "APPEALED"

class GrievancePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class HearingMode(str, enum.Enum):
    VIRTUAL_MEETING = "VIRTUAL_MEETING"
    PHYSICAL_OFFICE = "PHYSICAL_OFFICE"

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_number = Column(String(32), unique=True, nullable=False, index=True)
    complainant_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=True, index=True)
    category = Column(SQLEnum(GrievanceCategory), default=GrievanceCategory.OTHER, nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    district = Column(String(100), default="Ranchi", nullable=False)
    evidence_document_url = Column(Text, nullable=True)
    status = Column(SQLEnum(GrievanceStatus), default=GrievanceStatus.SUBMITTED, nullable=False, index=True)
    priority = Column(SQLEnum(GrievancePriority), default=GrievancePriority.MEDIUM, nullable=False)
    tier_level = Column(Integer, default=1, nullable=False)  # 1 = L1 Helpdesk, 2 = L2 DWO, 3 = L3 Directorate
    assigned_officer_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    sla_deadline = Column(DateTime, nullable=True)
    is_sla_breached = Column(Boolean, default=False, nullable=False)
    resolution_summary = Column(Text, nullable=True)
    action_taken_report = Column(Text, nullable=True)
    atr_digital_seal = Column(String(128), nullable=True)
    external_source = Column(String(50), default="PORTAL", nullable=True)  # PORTAL, CPGRAMS, JANSAMVAD, WHATSAPP
    external_reference_id = Column(String(64), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    timelines = relationship("GrievanceTimeline", back_populates="grievance", cascade="all, delete-orphan", order_by="GrievanceTimeline.created_at.asc()")
    hearings = relationship("GrievanceHearing", back_populates="grievance", cascade="all, delete-orphan", order_by="GrievanceHearing.scheduled_at.asc()")
    appeals = relationship("GrievanceAppeal", back_populates="grievance", cascade="all, delete-orphan")

class GrievanceTimeline(Base):
    __tablename__ = "grievance_timelines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    remarks = Column(Text, nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(150), default="System", nullable=False)
    actor_role = Column(String(50), default="SYSTEM", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    grievance = relationship("Grievance", back_populates="timelines")

class GrievanceHearing(Base):
    __tablename__ = "grievance_hearings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False)
    mode = Column(SQLEnum(HearingMode), default=HearingMode.VIRTUAL_MEETING, nullable=False)
    venue_or_link = Column(String(255), nullable=False)
    hearing_notes = Column(Text, nullable=True)
    attended_by_complainant = Column(Boolean, nullable=True)
    conducted_by_officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="SCHEDULED", nullable=False)  # SCHEDULED, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    grievance = relationship("Grievance", back_populates="hearings")

class GrievanceAppeal(Base):
    __tablename__ = "grievance_appeals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id"), nullable=False, index=True)
    complainant_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    appeal_reason = Column(Text, nullable=False)
    previous_resolution = Column(Text, nullable=True)
    target_tier = Column(Integer, default=3, nullable=False)  # Escalates directly to L3 Directorate
    status = Column(String(50), default="PENDING", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    grievance = relationship("Grievance", back_populates="appeals")

class HelpdeskArticle(Base):
    __tablename__ = "helpdesk_articles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(100), nullable=False, index=True)
    question = Column(String(255), nullable=False)
    answer = Column(Text, nullable=False)
    tags = Column(String(255), nullable=False)  # comma separated
    view_count = Column(Integer, default=0, nullable=False)
    helpful_count = Column(Integer, default=0, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
