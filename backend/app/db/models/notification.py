import enum
import uuid
from datetime import datetime, timezone
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

class NotificationCategory(str, enum.Enum):
    APPLICATION = "APPLICATION"
    SCRUTINY = "SCRUTINY"
    ALLOCATION = "ALLOCATION"
    DBT = "DBT"
    BROADCAST = "BROADCAST"
    SYSTEM = "SYSTEM"

class NotificationPriority(str, enum.Enum):
    URGENT = "URGENT"
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"

class DeliveryChannel(str, enum.Enum):
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    IN_APP = "IN_APP"

class DeliveryStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=True, index=True)
    category = Column(SQLEnum(NotificationCategory), default=NotificationCategory.SYSTEM, nullable=False)
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.NORMAL, nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(255), nullable=True)
    action_label = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    dispatch_logs = relationship("NotificationDispatchLog", back_populates="notification", cascade="all, delete-orphan")

class NotificationDispatchLog(Base):
    __tablename__ = "notification_dispatch_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    notification_id = Column(String(36), ForeignKey("notifications.id"), nullable=False, index=True)
    recipient_address = Column(String(200), nullable=False)
    channel = Column(SQLEnum(DeliveryChannel), nullable=False)
    dlt_template_id = Column(String(100), nullable=True)
    gateway_ref_id = Column(String(100), nullable=True, index=True)
    delivery_status = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.QUEUED, nullable=False)
    dlr_code = Column(String(50), nullable=True)
    failure_reason = Column(String(255), nullable=True)
    attempts = Column(Integer, default=1, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    notification = relationship("Notification", back_populates="dispatch_logs")

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    sms_enabled = Column(Boolean, default=True, nullable=False)
    whatsapp_enabled = Column(Boolean, default=True, nullable=False)
    email_enabled = Column(Boolean, default=True, nullable=False)
    in_app_enabled = Column(Boolean, default=True, nullable=False)
    preferred_language = Column(String(20), default="EN", nullable=False) # EN, HI, SANTALI, HO, MUNDARI
    dnd_start_hour = Column(Integer, default=21, nullable=False) # 9 PM
    dnd_end_hour = Column(Integer, default=7, nullable=False)   # 7 AM
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

class BroadcastCampaign(Base):
    __tablename__ = "broadcast_campaigns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    message_text = Column(Text, nullable=False)
    target_role = Column(String(50), default="STUDENT", nullable=False)
    target_district = Column(String(100), nullable=True)
    target_scheme_id = Column(String(50), nullable=True)
    channels = Column(String(100), default="IN_APP,SMS,WHATSAPP", nullable=False)
    total_recipients = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    initiated_by_officer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

class CommunicationAuditLog(Base):
    __tablename__ = "communication_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(64), nullable=False)
    notification_id = Column(String(36), nullable=True)
    recipient_id = Column(String(36), nullable=True)
    channel = Column(String(32), nullable=False)
    dlt_template_id = Column(String(100), nullable=True)
    message_hash = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=get_utc_now, nullable=False)
