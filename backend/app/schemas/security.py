from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class MfaSetupResponse(BaseModel):
    secret: str
    qr_code_base64: str
    otpauth_url: str

class MfaEnableRequest(BaseModel):
    totp_code: str = Field(..., min_length=6, max_length=6)

class MfaEnableResponse(BaseModel):
    message: str
    backup_codes: List[str]

class MfaDisableRequest(BaseModel):
    password: Optional[str] = None
    totp_code: Optional[str] = None

class SecurityQuestionItem(BaseModel):
    question_key: str
    answer: str

class SetSecurityQuestionsRequest(BaseModel):
    questions: List[SecurityQuestionItem]

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any]
    ip_address: str
    previous_log_hash: Optional[str] = None
    entry_hash: str
    created_at: datetime

    class Config:
        from_attributes = True

class BackupStatusResponse(BaseModel):
    last_backup_at: Optional[datetime] = None
    status: str
    file_name: Optional[str] = None
    storage_target: str = "MinIO / Local Encrypted Vault"
    rto_minutes: int = 15
    rpo_hours: int = 24
