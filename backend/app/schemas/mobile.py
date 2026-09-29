from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class OfflineSyncItemSchema(BaseModel):
    idempotency_token: str
    entity_type: str # 'APPLICATION_DRAFT', 'GRIEVANCE', 'DOCUMENT_UPLOAD'
    action: str # 'CREATE', 'UPDATE', 'SUBMIT'
    payload: Dict[str, Any]
    client_timestamp: Optional[datetime] = None

class OfflineSyncBatchRequest(BaseModel):
    device_id: str
    items: List[OfflineSyncItemSchema]

class OfflineSyncItemResult(BaseModel):
    idempotency_token: str
    entity_type: str
    status: str # 'SYNCED', 'CONFLICT', 'REJECTED'
    message: str
    server_entity_id: Optional[str] = None

class OfflineSyncBatchResponse(BaseModel):
    device_id: str
    processed_count: int
    synced_count: int
    conflict_count: int
    results: List[OfflineSyncItemResult]

class VernacularTranslationResponse(BaseModel):
    language_code: str
    language_name: str
    script_name: str
    direction: str = "ltr"
    strings: Dict[str, str]

class DocumentCompressionRequest(BaseModel):
    filename: str
    file_type: str
    original_size_kb: float
    quality_tier: Optional[str] = "2G_ULTRA_LOW" # "2G_ULTRA_LOW", "3G_BALANCED", "STANDARD"
    base64_sample: Optional[str] = None

class DocumentCompressionResponse(BaseModel):
    filename: str
    original_size_kb: float
    compressed_size_kb: float
    compression_ratio: float
    quality_tier: str
    legibility_score: float
    is_2g_optimized: bool

class AudioPromptResponse(BaseModel):
    prompt_key: str
    language_code: str
    language_name: str
    transcript: str
    audio_url: str
    duration_seconds: float

class WebAuthnRegisterOptionsRequest(BaseModel):
    device_name: Optional[str] = "Mobile Biometric Sensor"

class WebAuthnChallengeResponse(BaseModel):
    challenge: str
    user_id: str
    rp_name: str
    rp_id: str
    timeout: int = 60000

class WebAuthnRegisterVerifyRequest(BaseModel):
    credential_id: str
    public_key: str
    attestation_type: Optional[str] = "none"
    device_name: Optional[str] = "Mobile Biometric Sensor"

class WebAuthnLoginVerifyRequest(BaseModel):
    credential_id: str
    signature: str
    challenge: str

class WebAuthnAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    device_name: Optional[str] = None
