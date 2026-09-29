import enum
import uuid
from datetime import datetime, timezone, date
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Enum as SQLEnum,
    Text,
    JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class SessionType(str, enum.Enum):
    LOK_SABHA = "LOK_SABHA"
    RAJYA_SABHA = "RAJYA_SABHA"
    VIDHAN_SABHA = "VIDHAN_SABHA"
    CAG_AUDIT = "CAG_AUDIT"
    EXECUTIVE_REVIEW = "EXECUTIVE_REVIEW"

class DailyReportSnapshot(Base):
    __tablename__ = "daily_report_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    snapshot_date = Column(Date, default=date.today, nullable=False, index=True)
    financial_year = Column(String(20), default="2026-2027", nullable=False, index=True)
    total_applications = Column(Integer, default=0, nullable=False)
    verified_institutions = Column(Integer, default=0, nullable=False)
    dwo_approved = Column(Integer, default=0, nullable=False)
    sanctioned_students = Column(Integer, default=0, nullable=False)
    dbt_disbursed_amount = Column(Float, default=0.0, nullable=False)
    dbt_success_count = Column(Integer, default=0, nullable=False)
    dbt_failed_count = Column(Integer, default=0, nullable=False)
    pvtg_beneficiaries_count = Column(Integer, default=0, nullable=False)
    female_beneficiaries_count = Column(Integer, default=0, nullable=False)
    active_grievances_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

class DistrictMetric(Base):
    __tablename__ = "district_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    district_name = Column(String(100), nullable=False, index=True)
    financial_year = Column(String(20), default="2026-2027", nullable=False, index=True)
    total_applications = Column(Integer, default=0, nullable=False)
    total_disbursed_amount = Column(Float, default=0.0, nullable=False)
    avg_tat_days = Column(Float, default=0.0, nullable=False)
    pvtg_count = Column(Integer, default=0, nullable=False)
    active_institutions = Column(Integer, default=0, nullable=False)
    saturation_rate = Column(Float, default=0.0, nullable=False)
    female_ratio = Column(Float, default=50.0, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

class ParliamentQuestionExport(Base):
    __tablename__ = "parliament_question_exports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_reference_no = Column(String(64), nullable=False, index=True)
    generated_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    session_type = Column(SQLEnum(SessionType), default=SessionType.LOK_SABHA, nullable=False)
    export_title = Column(String(255), nullable=False)
    financial_year = Column(String(20), default="2026-2027", nullable=False)
    export_format = Column(String(10), default="CSV", nullable=False)  # CSV, JSON, PDF
    export_params = Column(JSON, nullable=True)
    record_count = Column(Integer, default=0, nullable=False)
    export_data = Column(Text, nullable=True)
    sha256_hash = Column(String(64), nullable=False)
    generated_at = Column(DateTime, default=get_utc_now, nullable=False)

class ExecutiveScheduledReport(Base):
    __tablename__ = "executive_scheduled_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_title = Column(String(255), nullable=False)
    recipient_role = Column(String(50), default="CHIEF_SECRETARY", nullable=False)
    recipient_email = Column(String(255), nullable=False)
    frequency = Column(String(20), default="WEEKLY", nullable=False)  # DAILY, WEEKLY, MONTHLY
    is_active = Column(Boolean, default=True, nullable=False)
    last_dispatched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
