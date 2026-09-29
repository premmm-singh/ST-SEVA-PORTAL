from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class DocumentResponse(BaseModel):
    id: str
    student_id: str
    application_id: Optional[str] = None
    document_category: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    is_encrypted: bool = True
    scan_status: str
    scan_notes: Optional[str] = None
    version: int
    is_active: bool
    parent_document_id: Optional[str] = None
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    is_expired: bool
    source: str
    digilocker_uri: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    signed_preview_url: Optional[str] = None
    signed_download_url: Optional[str] = None

    class Config:
        from_attributes = True

class SignedUrlResponse(BaseModel):
    document_id: str
    action: str
    url: str
    expires_at: int
    expires_in_seconds: int

class IntegrityCheckResponse(BaseModel):
    document_id: str
    stored_sha256: str
    computed_sha256: str
    is_valid: bool
    verified_at: datetime

class DigiLockerPullRequest(BaseModel):
    document_category: str # CASTE_CERTIFICATE or INCOME_CERTIFICATE
    application_id: Optional[str] = None

class ExpiringDocumentsResponse(BaseModel):
    count: int
    expiring_documents: List[DocumentResponse]
