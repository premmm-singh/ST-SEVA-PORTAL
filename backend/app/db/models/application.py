import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_number = Column(String(30), unique=True, index=True, nullable=False) # ST-2026-XXXXXX
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(String(50), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20), default="2026-2027")
    status = Column(String(30), default="DRAFT", nullable=False) # DRAFT, SUBMITTED, UNDER_SCRUTINY, DEFICIENT, APPROVED, REJECTED, WITHDRAWN
    is_locked = Column(Boolean, default=False, nullable=False)
    submission_date = Column(DateTime, nullable=True)
    application_data = Column(JSON, default=dict)
    
    # Withdrawal & Rejection tracking
    withdrawal_reason = Column(Text, nullable=True)
    withdrawn_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    cloned_from_id = Column(String(36), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    scheme = relationship("Scheme", back_populates="applications")
    timeline_events = relationship("ApplicationTimeline", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationTimeline.created_at.asc()")

class ApplicationDraft(Base):
    __tablename__ = "application_drafts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(String(50), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    current_step = Column(Integer, default=1)
    draft_data = Column(JSON, default=dict)
    last_saved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    scheme = relationship("Scheme", back_populates="drafts")

class ApplicationTimeline(Base):
    __tablename__ = "application_timeline"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String(50), nullable=False) # DRAFT_SAVED, APPLICATION_SUBMITTED, etc.
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    actor_role = Column(String(30), default="STUDENT") # STUDENT, WELFARE_OFFICER, ADMIN, SYSTEM
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="timeline_events")
