from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ScrutinyStatsResponse(BaseModel):
    pending_l1_count: int
    pending_l2_count: int
    pending_l3_count: int
    sanctioned_count: int
    deficient_count: int
    rejected_count: int
    red_risk_count: int
    total_count: int

class CrossVerifyRequest(BaseModel):
    cert_type: str = Field(..., description="CASTE, INCOME, DOMICILE, RATION_CARD, UDID, DEATH")
    cert_number: str = Field(..., min_length=2)
    claimed_income: Optional[float] = None
    sub_caste: Optional[str] = None
    district: Optional[str] = None

class CrossVerifyResponse(BaseModel):
    cert_type: str
    verified: bool
    details: Dict[str, Any]

class DuplicateFlagResponse(BaseModel):
    id: str
    application_id: str
    matched_application_id: Optional[str] = None
    matched_application_number: Optional[str] = None
    match_type: str
    confidence_score: float
    match_details: str
    is_cleared: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PhysicalInspectionCreate(BaseModel):
    institution_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_address: Optional[str] = None
    student_present: bool = True
    hostel_room_verified: bool = False
    inspection_summary: str = Field(..., min_length=5)
    photo_url: Optional[str] = None

class PhysicalInspectionResponse(BaseModel):
    id: str
    inspector_id: str
    inspector_name: str
    institution_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_address: Optional[str] = None
    student_present: bool
    hostel_room_verified: bool
    inspection_summary: str
    photo_url: Optional[str] = None
    inspected_at: datetime

    class Config:
        from_attributes = True

class ScrutinyActionRequest(BaseModel):
    scrutiny_level: str = Field(..., description="L1_SCRUTINY, L2_VERIFICATION, L3_SANCTION")
    decision: str = Field(..., description="RECOMMENDED, APPROVED, DEFICIENT, REJECTED, SANCTIONED")
    checklist: Dict[str, bool] = Field(
        ...,
        description="Statutory items: caste_verified, income_verified, domicile_verified, bonafide_verified, dbt_eligible, duplicate_check_passed"
    )
    remarks: Optional[str] = None

class ScrutinyActionResponse(BaseModel):
    id: str
    application_id: str
    officer_name: str
    scrutiny_level: str
    decision: str
    digital_signature_hash: str
    action_at: datetime
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class ClearDuplicateRequest(BaseModel):
    remarks: str = Field(..., min_length=5, description="Officer justification for clearing the duplicate collision")
