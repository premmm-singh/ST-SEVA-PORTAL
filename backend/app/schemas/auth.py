from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class MobileOtpSendRequest(BaseModel):
    mobile_number: str = Field(..., pattern=r"^[6-9]\d{9}$", description="10-digit Indian mobile number")
    purpose: str = "login"

class MobileOtpVerifyRequest(BaseModel):
    mobile_number: str = Field(..., pattern=r"^[6-9]\d{9}$")
    otp_code: str = Field(..., min_length=6, max_length=6)
    device_name: Optional[str] = "Web Browser"
    device_fingerprint: Optional[str] = None

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None
    device_name: Optional[str] = "Web Browser"
    device_fingerprint: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    requires_mfa: bool = False
    mfa_temp_token: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class RegisterRequest(BaseModel):
    mobile_number: str = Field(..., pattern=r"^[6-9]\d{9}$")
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8)
    full_name: str
    aadhaar_number: Optional[str] = None
    consent_aadhaar: bool = True

class AadhaarEkycRequest(BaseModel):
    aadhaar_number: str = Field(..., pattern=r"^\d{12}$")

class AadhaarEkycVerify(BaseModel):
    aadhaar_number: str = Field(..., pattern=r"^\d{12}$")
    otp_code: str = Field(..., min_length=6, max_length=6)
