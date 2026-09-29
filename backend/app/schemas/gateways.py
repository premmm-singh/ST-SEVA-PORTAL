from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# F-129: DigiLocker NeGD Production Gateway
class DigiLockerPullRequest(BaseModel):
    uri: str = Field(..., description="NeGD statutory document URI, e.g. in.gov.jh.jharsewa-CERT-90412")
    consent_artifact_id: Optional[str] = None

class DigiLockerPullResponse(BaseModel):
    uri: str
    issuer_id: str
    issuer_name: str
    document_type: str
    issued_date: str
    is_signature_valid: bool
    mime_type: str
    doc_content_preview: str

# F-130: UIDAI Aadhaar Vault & Tokenization Engine
class AadhaarTokenizeRequest(BaseModel):
    raw_aadhaar_number: str = Field(..., min_length=12, max_length=12)
    consent_timestamp: Optional[datetime] = None

class AadhaarTokenizeResponse(BaseModel):
    vault_token: str
    masked_aadhaar: str
    encryption_algorithm: str
    is_ekyc_verified: bool
    created_at: datetime

# F-131: NPCI Aadhaar Payment Bridge (APB) Mapper Ingestion
class NpciSyncMapperRecord(BaseModel):
    aadhaar_vault_token: str
    bank_iin: str # 6-digit IIN (e.g., 607152 for SBI, 508534 for BOI)
    bank_name: str
    account_number_masked: str
    seeding_status: str = "ACTIVE"

class NpciSyncMapperRequest(BaseModel):
    batch_reference: str
    records: List[NpciSyncMapperRecord]

class NpciSyncMapperResponse(BaseModel):
    batch_reference: str
    synced_records_count: int
    active_count: int
    dormant_count: int
    timestamp: datetime

class NpciStatusLookupResponse(BaseModel):
    aadhaar_vault_token: str
    bank_iin: str
    bank_name: str
    account_number_masked: str
    seeding_status: str
    last_seeded_date: datetime

# F-132: PFMS Core XML Exchange & Digital Signature (DSC)
class PfmsBatchDispatchRequest(BaseModel):
    batch_id: str
    dsc_token_id: str = "DSC-GOV-JH-2026-X509"

class PfmsBatchDispatchResponse(BaseModel):
    message_id: str
    batch_id: str
    status: str
    pfms_acknowledgment_id: str
    xml_payload_preview: str
    dsc_signature: str
    dispatched_at: datetime

# F-133: AISHE Master Directory Sync & College Verification API
class AisheVerificationResponse(BaseModel):
    aishe_code: str
    institution_name: str
    state: str
    district: str
    naac_grade: str
    nirf_rank: Optional[int] = None
    affiliation_status: str
    is_active: bool

# F-134: Academic Examination Boards (CBSE/JAC) e-Marksheet Webhooks
class AcademicMarksVerifyRequest(BaseModel):
    board_name: str = "JAC" # JAC, CBSE, CISCE
    roll_code: str
    roll_number: str
    passing_year: int = 2025

class AcademicMarksVerifyResponse(BaseModel):
    board_name: str
    roll_code: str
    roll_number: str
    student_name: str
    passing_year: int
    total_marks: int
    percentage: float
    result_status: str
    verified_digitally: bool

# F-135: JharSewa / e-District Caste & Income Certificate API
class JharSewaCertificateVerifyRequest(BaseModel):
    certificate_number: str
    applicant_name: str
    certificate_type: str = "CASTE" # CASTE or INCOME

class JharSewaCertificateVerifyResponse(BaseModel):
    certificate_number: str
    applicant_name: str
    certificate_type: str
    sub_caste: Optional[str] = None
    annual_income: Optional[float] = None
    issuing_authority: str
    issue_date: str
    is_valid: bool
    district: str

# F-136: UMANG Mobile App REST Gateway & SSO
class UmangSsoExchangeRequest(BaseModel):
    umang_auth_token: str
    mobile_number: str

class UmangSsoExchangeResponse(BaseModel):
    portal_access_token: str
    user_id: str
    user_name: str
    role: str
    registered_applications_count: int

# F-137: Webhook Subscription Hub & Outbound Event Dispatcher
class WebhookSubscribeRequest(BaseModel):
    subscriber_name: str
    target_url: str
    event_types: str = "APPLICATION_SUBMITTED,SANCTION_ISSUED,DISBURSED"

class WebhookSubscriptionResponse(BaseModel):
    id: str
    subscriber_name: str
    target_url: str
    secret_key: str
    event_types: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class WebhookDispatchLogResponse(BaseModel):
    id: str
    subscription_id: str
    event_type: str
    signature_header: str
    status_code: int
    dispatched_at: datetime

    class Config:
        from_attributes = True

# F-138: External API Rate Limiting & DDoS Shield
class RateLimitCheckResponse(BaseModel):
    client_ip: str
    allowed: bool
    tokens_remaining: int
    reset_seconds: int
