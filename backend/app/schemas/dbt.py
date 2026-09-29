from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.db.models.dbt import (
    PaymentBatchStatus,
    DisbursementComponentType,
    TransactionStatus,
    TreasuryBillStatus
)

class PennyDropRequest(BaseModel):
    account_number: str
    ifsc_code: str
    entered_name: str
    application_id: Optional[str] = None

class PennyDropResponse(BaseModel):
    id: str
    student_id: str
    application_id: Optional[str] = None
    account_number_masked: str
    ifsc_code: str
    bank_name: str
    entered_name: str
    returned_name: str
    similarity_score: float
    status: str
    reference_ref: Optional[str] = None
    verified_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NpciSeedingResponse(BaseModel):
    aadhaar_last_four: str
    is_seeded: bool
    seeding_status: str
    mandate_bank: Optional[str] = None
    mandate_date: Optional[str] = None
    apbs_eligible: bool
    message: str

class BatchCreateRequest(BaseModel):
    scheme_id: str
    cycle_id: str
    tranche_number: int = 1
    tranche_percentage: float = 100.0
    split_enabled: bool = True

class DisbursementTransactionResponse(BaseModel):
    id: str
    batch_id: str
    sanction_order_id: Optional[str] = None
    application_id: str
    student_id: str
    component_type: DisbursementComponentType
    recipient_type: str
    beneficiary_name: str
    institution_id: Optional[str] = None
    account_number_masked: str
    ifsc_code: str
    bank_name: str
    aadhaar_last_four: Optional[str] = None
    amount: float
    tranche_number: int
    tranche_percentage: float
    status: TransactionStatus
    utr_number: Optional[str] = None
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    retry_count: int
    settled_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaymentBatchResponse(BaseModel):
    id: str
    batch_number: str
    scheme_id: str
    cycle_id: Optional[str] = None
    total_records: int
    total_amount: float
    status: PaymentBatchStatus
    created_by_officer_id: str
    dispatched_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    pfms_reference_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaymentBatchDetailResponse(PaymentBatchResponse):
    transactions: List[DisbursementTransactionResponse] = []

class TreasuryBillCreateRequest(BaseModel):
    district: str = "RANCHI"

class TreasuryBillResponse(BaseModel):
    id: str
    bill_number: str
    district: str
    financial_year: str
    batch_id: str
    gross_amount: float
    deductions: float
    net_amount: float
    dwo_officer_id: str
    token_number: Optional[str] = None
    status: TreasuryBillStatus
    digital_sign_hash: Optional[str] = None
    signed_at: Optional[datetime] = None
    treasury_pass_date: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RetryTransactionRequest(BaseModel):
    new_account_number: Optional[str] = None
    new_ifsc: Optional[str] = None

class ReverseTransactionRequest(BaseModel):
    reason: str

class UpiPaymentInitiateRequest(BaseModel):
    amount: float
    purpose: str = "SCHOLARSHIP_REFUND"

class UpiPaymentResponse(BaseModel):
    transaction_reference: str
    payee_vpa: str
    payee_name: str
    amount: float
    currency: str
    purpose: str
    upi_intent_uri: str
    qr_code_payload: str
    status: str
    expires_in_minutes: int

class TreasuryLedgerResponse(BaseModel):
    id: str
    financial_year: str
    major_head: str
    sub_major_head: str
    minor_head: str
    sub_head: str
    description: str
    allocated_budget: float
    expended_amount: float
    committed_amount: float
    balance_amount: float
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
