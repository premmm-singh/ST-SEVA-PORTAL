import uuid
from datetime import date, datetime, timezone
from sqlalchemy import Column, String, Boolean, Numeric, Date, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Scheme(Base):
    __tablename__ = "schemes"
    
    id = Column(String(50), primary_key=True) # e.g. ST_PRE_MATRIC, ST_POST_MATRIC
    scheme_name = Column(String(255), nullable=False)
    scheme_code = Column(String(50), unique=True, nullable=False) # e.g. MTA-PMS-2026
    scheme_type = Column(String(50), default="CENTRALLY_SPONSORED") # CENTRAL_SECTOR, CENTRALLY_SPONSORED
    education_level = Column(String(50), default="COLLEGE") # SECONDARY, HIGHER_SECONDARY, COLLEGE, RESEARCH
    financial_assistance_details = Column(Text, nullable=True)
    max_family_income = Column(Numeric(12, 2), nullable=True)
    academic_year = Column(String(20), default="2026-2027")
    application_start_date = Column(Date, default=date(2026, 1, 1))
    application_deadline = Column(Date, default=date(2026, 12, 31))
    is_active = Column(Boolean, default=True)
    guidelines_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    applications = relationship("Application", back_populates="scheme", cascade="all, delete-orphan")
    drafts = relationship("ApplicationDraft", back_populates="scheme", cascade="all, delete-orphan")
