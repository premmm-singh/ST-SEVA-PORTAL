from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

class StudentProfileBase(BaseModel):
    full_name: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    category: Optional[str] = "Scheduled Tribe (ST)"
    sub_caste: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    annual_family_income: Optional[float] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None # Will be AES-encrypted upon write
    bank_ifsc: Optional[str] = None
    bank_branch: Optional[str] = None
    institution_name: Optional[str] = None
    institution_code_aishe: Optional[str] = None
    course_name: Optional[str] = None
    current_year_of_study: Optional[int] = None

class StudentProfileResponse(StudentProfileBase):
    id: str
    user_id: str
    bank_account_masked: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OfficerProfileBase(BaseModel):
    full_name: str
    designation: Optional[str] = None
    department: Optional[str] = "Tribal Welfare Department"
    state: Optional[str] = "Jharkhand"
    district: Optional[str] = "Ranchi"
    office_address: Optional[str] = None
    employee_id: Optional[str] = None
    assigned_schemes: Optional[List[str]] = []

class OfficerProfileResponse(OfficerProfileBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminProfileBase(BaseModel):
    full_name: str
    admin_level: Optional[str] = "NATIONAL_ADMIN"
    jurisdiction: Optional[str] = "Ministry of Tribal Affairs, New Delhi"
    contact_email: Optional[EmailStr] = None

class AdminProfileResponse(AdminProfileBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfileMeResponse(BaseModel):
    user_id: str
    email: Optional[str] = None
    mobile_masked: Optional[str] = None
    role: str
    is_verified: bool
    student_profile: Optional[StudentProfileResponse] = None
    officer_profile: Optional[OfficerProfileResponse] = None
    admin_profile: Optional[AdminProfileResponse] = None
    has_mfa: bool = False
