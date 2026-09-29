from datetime import datetime, timezone
import enum
import uuid
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Text,
    JSON
)
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class GatewayExchangeStatus(str, enum.Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"

class AadhaarVaultToken(Base):
    """F-130: UIDAI Aadhaar Vault & Tokenization Engine."""
    __tablename__ = "gateway_aadhaar_vault"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    tokenized_reference = Column(String(64), unique=True, nullable=False, index=True)
    masked_aadhaar = Column(String(16), nullable=False) # e.g. "XXXXXXXX1234"
    encryption_algorithm = Column(String(32), default="AES-256-GCM")
    is_ekyc_verified = Column(Boolean, default=True)
    vault_created_at = Column(DateTime, default=get_utc_now)

class NpciMapperRecord(Base):
    """F-131: NPCI Aadhaar Payment Bridge (APB) & Mapper Bulk Ingestion."""
    __tablename__ = "gateway_npci_mapper"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    aadhaar_vault_token = Column(String(64), nullable=False, index=True)
    bank_iin = Column(String(16), nullable=False, index=True) # Institution Identification Number (e.g., 607152 for SBI)
    bank_name = Column(String(100), nullable=False)
    account_number_masked = Column(String(32), nullable=False)
    seeding_status = Column(String(32), default="ACTIVE") # ACTIVE, INACTIVE, DORMANT
    last_seeded_date = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)

class PfmsExchangeMessage(Base):
    """F-132: PFMS Core XML Exchange Engine & Digital Signature (DSC)."""
    __tablename__ = "gateway_pfms_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("dbt_payment_batches.id"), nullable=False, index=True)
    message_type = Column(String(32), default="PAO_SANCTION_PUSH")
    xml_payload = Column(Text, nullable=False)
    dsc_signature = Column(Text, nullable=True) # PKCS#7 X.509 Base64
    status = Column(SQLEnum(GatewayExchangeStatus), default=GatewayExchangeStatus.PENDING)
    pfms_acknowledgment_id = Column(String(64), nullable=True, index=True)
    acknowledgment_xml = Column(Text, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class AisheMasterRecord(Base):
    """F-133: AISHE Master Directory Sync & College Verification API."""
    __tablename__ = "gateway_aishe_master"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    aishe_code = Column(String(32), unique=True, nullable=False, index=True)
    institution_name = Column(String(200), nullable=False)
    state = Column(String(64), default="Jharkhand")
    district = Column(String(64), nullable=False, index=True)
    naac_grade = Column(String(16), default="A+")
    nirf_rank = Column(Integer, nullable=True)
    affiliation_status = Column(String(64), default="AFFILIATED_STATE_VARSITY")
    is_active = Column(Boolean, default=True)
    synced_at = Column(DateTime, default=get_utc_now)

class WebhookSubscription(Base):
    """F-137: Webhook Subscription Hub & Outbound Event Dispatcher."""
    __tablename__ = "gateway_webhook_subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subscriber_name = Column(String(100), nullable=False)
    target_url = Column(String(255), nullable=False)
    secret_key = Column(String(64), nullable=False)
    event_types = Column(String(255), default="APPLICATION_SUBMITTED,SANCTION_ISSUED,DISBURSED")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

class WebhookDispatchLog(Base):
    """Outbound webhook delivery tracking."""
    __tablename__ = "gateway_webhook_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subscription_id = Column(String(36), ForeignKey("gateway_webhook_subscriptions.id"), nullable=False)
    event_type = Column(String(64), nullable=False)
    payload_preview = Column(Text, nullable=False)
    signature_header = Column(String(128), nullable=False) # HMAC-SHA256
    status_code = Column(Integer, default=200)
    dispatched_at = Column(DateTime, default=get_utc_now)
