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
    Text
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class PaymentBatchStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    DISPATCHED_TO_PFMS = "DISPATCHED_TO_PFMS"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    PROCESSED = "PROCESSED"
    PARTIALLY_FAILED = "PARTIALLY_FAILED"
    FAILED = "FAILED"

class DisbursementComponentType(str, enum.Enum):
    TUITION_INSTITUTION = "TUITION_INSTITUTION"
    MAINTENANCE_STUDENT = "MAINTENANCE_STUDENT"

class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PENNY_DROP_VERIFIED = "PENNY_DROP_VERIFIED"
    SENT_TO_PFMS = "SENT_TO_PFMS"
    CREDIT_CONFIRMED = "CREDIT_CONFIRMED"
    FAILED = "FAILED"
    RETURNED = "RETURNED"
    REVERSED = "REVERSED"

class TreasuryBillStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SIGNED = "SIGNED"
    SUBMITTED_TO_TREASURY = "SUBMITTED_TO_TREASURY"
    TREASURY_CLEARED = "TREASURY_CLEARED"
    REJECTED = "REJECTED"

class PaymentBatch(Base):
    __tablename__ = "dbt_payment_batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_number = Column(String(64), unique=True, nullable=False, index=True)
    scheme_id = Column(String(36), ForeignKey("schemes.id"), nullable=False)
    cycle_id = Column(String(36), ForeignKey("allocation_cycles.id"), nullable=True)
    sanction_order_id = Column(String(36), nullable=True)
    total_records = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    status = Column(SQLEnum(PaymentBatchStatus), default=PaymentBatchStatus.DRAFT, nullable=False)
    created_by_officer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    dispatched_at = Column(DateTime, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    pfms_reference_id = Column(String(100), nullable=True, index=True)
    xml_payload = Column(Text, nullable=True)
    acknowledgment_receipt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    transactions = relationship("DisbursementTransaction", back_populates="batch", cascade="all, delete-orphan")
    treasury_bill = relationship("TreasuryBill", back_populates="batch", uselist=False)

class DisbursementTransaction(Base):
    __tablename__ = "dbt_disbursement_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("dbt_payment_batches.id"), nullable=False)
    sanction_order_id = Column(String(36), nullable=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    component_type = Column(SQLEnum(DisbursementComponentType), nullable=False)
    recipient_type = Column(String(32), default="STUDENT") # STUDENT or INSTITUTION
    beneficiary_name = Column(String(200), nullable=False)
    institution_id = Column(String(36), nullable=True)
    account_number_masked = Column(String(32), nullable=False)
    ifsc_code = Column(String(16), nullable=False)
    bank_name = Column(String(100), nullable=False)
    aadhaar_last_four = Column(String(4), nullable=True)
    amount = Column(Float, nullable=False)
    tranche_number = Column(Integer, default=1)
    tranche_percentage = Column(Float, default=100.0)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    utr_number = Column(String(64), nullable=True, index=True)
    failure_code = Column(String(32), nullable=True)
    failure_reason = Column(String(255), nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    last_retry_at = Column(DateTime, nullable=True)
    reverse_reason = Column(String(255), nullable=True)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    batch = relationship("PaymentBatch", back_populates="transactions")

class PennyDropVerification(Base):
    __tablename__ = "dbt_penny_drop_verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    application_id = Column(String(36), nullable=True)
    account_number_masked = Column(String(32), nullable=False)
    ifsc_code = Column(String(16), nullable=False)
    bank_name = Column(String(100), nullable=False)
    entered_name = Column(String(200), nullable=False)
    returned_name = Column(String(200), nullable=False)
    similarity_score = Column(Float, default=0.0)
    status = Column(String(32), default="MATCHED") # MATCHED, MISMATCH, FAILED
    reference_ref = Column(String(64), nullable=True)
    verified_at = Column(DateTime, default=get_utc_now)

class TreasuryHeadLedger(Base):
    __tablename__ = "dbt_treasury_head_ledgers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    financial_year = Column(String(16), nullable=False)
    major_head = Column(String(16), default="2225") # Welfare of SC, ST, OBC
    sub_major_head = Column(String(16), default="02") # Welfare of ST
    minor_head = Column(String(16), default="277") # Education
    sub_head = Column(String(16), default="001") # Scholarships
    description = Column(String(255), default="Direct Benefit Transfer ST Scholarship Scheme")
    allocated_budget = Column(Float, default=10000000.0)
    expended_amount = Column(Float, default=0.0)
    committed_amount = Column(Float, default=0.0)
    balance_amount = Column(Float, default=10000000.0)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

class TreasuryBill(Base):
    __tablename__ = "dbt_treasury_bills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    bill_number = Column(String(64), unique=True, nullable=False, index=True)
    district = Column(String(100), nullable=False)
    financial_year = Column(String(16), nullable=False)
    batch_id = Column(String(36), ForeignKey("dbt_payment_batches.id"), nullable=False)
    gross_amount = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    dwo_officer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    token_number = Column(String(32), nullable=True)
    status = Column(SQLEnum(TreasuryBillStatus), default=TreasuryBillStatus.DRAFT, nullable=False)
    digital_sign_hash = Column(String(128), nullable=True)
    signed_at = Column(DateTime, nullable=True)
    treasury_pass_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    batch = relationship("PaymentBatch", back_populates="treasury_bill")

class DbtAuditLog(Base):
    __tablename__ = "dbt_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(64), nullable=False)
    batch_id = Column(String(36), nullable=True)
    transaction_id = Column(String(36), nullable=True)
    actor_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=get_utc_now)
    ip_address = Column(String(45), nullable=True)
