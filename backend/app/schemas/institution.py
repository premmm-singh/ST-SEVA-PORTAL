from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class InstitutionMasterResponse(BaseModel):
    aishe_code: str
    udise_code: Optional[str] = None
    name: str
    institution_type: str
    affiliated_university: Optional[str] = None
    state: str
    district: str
    pincode: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class InstitutionRegisterRequest(BaseModel):
    aishe_code: str = Field(..., description="Accredited AISHE or U-DISE Code")
    nodal_officer_name: str = Field(..., min_length=2, max_length=150)
    nodal_officer_designation: str = Field("Institutional Nodal Officer (INO)", max_length=100)
    official_email: EmailStr
    contact_mobile: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)

class InstitutionProfileResponse(BaseModel):
    id: str
    aishe_code: str
    institution_name: str
    institution_type: Optional[str] = None
    affiliated_university: Optional[str] = None
    state: str
    district: str
    nodal_officer_name: str
    nodal_officer_designation: str
    official_email: str
    contact_mobile: str
    verification_status: str

    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    pending_count: int
    verified_count: int
    defective_count: int
    rejected_count: int
    total_count: int
    total_st_beneficiaries: int

class VerifyStudentRequest(BaseModel):
    bonafide_confirmed: bool = True
    roll_number: Optional[str] = None
    admission_year: Optional[int] = None
    attendance_percentage: float = Field(..., ge=0.0, le=100.0, description="Official academic attendance percentage")
    attendance_remarks: Optional[str] = None
    is_hosteller: bool = False
    hostel_name: Optional[str] = None
    hostel_room_no: Optional[str] = None
    fee_approved: Optional[float] = None
    fee_status: Optional[str] = "MATCH" # MATCH, MISMATCH, ADJUSTED
    academic_verified: bool = True
    previous_year_percentage: Optional[float] = None
    cgpa: Optional[float] = None
    has_uncleared_backlogs: bool = False
    remarks: Optional[str] = None

class DefectNoticeRequest(BaseModel):
    defect_category: str = Field(..., description="UNREADABLE_MARK_SHEET, INCORRECT_FEE_RECEIPT, ATTENDANCE_MISMATCH, etc.")
    defect_description: str = Field(..., min_length=5, description="Clear instructions on what the student needs to correct")
    correction_deadline_days: int = Field(7, ge=1, le=30, description="Days allowed for resubmission (default: 7)")

class BulkVerifyRequest(BaseModel):
    application_ids: List[str] = Field(..., min_items=1)
    remarks: Optional[str] = "Bulk approved by Institutional Nodal Officer"

class BulkVerifyResponse(BaseModel):
    total_processed: int
    successful_count: int
    failed_count: int
    results: List[Dict[str, Any]]

class FeeStructureCreate(BaseModel):
    course_name: str
    academic_year: str = "2026-2027"
    tuition_fee: float = 0.0
    admission_fee: float = 0.0
    exam_fee: float = 0.0
    library_fee: float = 0.0
    hostel_fee: float = 0.0

class FeeStructureResponse(BaseModel):
    id: str
    institution_id: str
    course_name: str
    academic_year: str
    tuition_fee: float
    admission_fee: float
    exam_fee: float
    library_fee: float
    hostel_fee: float
    total_annual_fee: float
    created_at: datetime

    class Config:
        from_attributes = True

class InstitutionGrievanceCreate(BaseModel):
    category: str = Field(..., description="QUOTA_INQUIRY, FEE_REIMBURSEMENT, PORTAL_BUG, STUDENT_DISPUTE")
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    priority: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH, URGENT")

class InstitutionGrievanceResponse(BaseModel):
    id: str
    ticket_number: str
    category: str
    subject: str
    description: str
    status: str
    priority: str
    response_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VerificationAuditRecord(BaseModel):
    id: str
    application_id: str
    bonafide_confirmed: bool
    attendance_percentage: float
    attendance_compliant: bool
    is_hosteller: bool
    fee_claimed: Optional[float]
    fee_approved: Optional[float]
    fee_status: str
    verification_status: str
    digital_stamp: str
    verified_at: datetime
    nodal_officer_name: str
    institution_name: str

    class Config:
        from_attributes = True
