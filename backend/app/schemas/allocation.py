from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.db.models.allocation import (
    AllocationCycleStatus,
    AllocationResultStatus,
    QuotaCategory,
    ObjectionType,
    ObjectionStatus
)


class AllocationCycleCreate(BaseModel):
    scheme_id: str
    academic_year: str = "2026-2027"
    financial_year: str = "2026-2027"
    total_budget: float = Field(default=5000000.0, ge=1000.0)
    total_seats: int = Field(default=100, ge=1)


class AllocationCycleResponse(BaseModel):
    id: str
    scheme_id: str
    scheme_name: Optional[str] = None
    academic_year: str
    financial_year: str
    total_budget: float
    allocated_budget: float
    total_seats: int
    status: AllocationCycleStatus
    objection_deadline: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MeritScoreResponse(BaseModel):
    id: str
    application_id: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    academic_score: float
    income_score: float
    pvtg_bonus: float
    total_merit_score: float
    core_subject_marks: float
    family_income: float
    rank_overall: Optional[int] = None
    pvtg_community: Optional[str] = None
    is_female: bool
    is_pwd: bool
    is_sports: bool
    district: Optional[str] = None

    class Config:
        from_attributes = True


class AllocationResultResponse(BaseModel):
    id: str
    application_id: str
    student_id: str
    student_name: Optional[str] = None
    status: AllocationResultStatus
    quota_category: QuotaCategory
    allocated_amount: float
    maintenance_allowance: float
    tuition_reimbursement: float
    waitlist_number: Optional[int] = None
    sanction_order_number: Optional[str] = None

    class Config:
        from_attributes = True


class AllocationSimulationResponse(BaseModel):
    cycle_id: str
    academic_year: str
    scheme_name: str
    total_applicants: int
    total_seats: int
    total_budget: float
    allocated_budget: float
    budget_utilization_pct: float
    seats_filled: int
    quota_distribution: Dict[str, Any]
    waitlisted_count: int
    dry_run: bool


class SchemeSwitchRequest(BaseModel):
    from_cycle_id: str
    to_cycle_id: str


class SchemeSwitchResponse(BaseModel):
    message: str
    switched_student_id: str
    auto_promoted: Optional[Dict[str, Any]] = None


class RenewalCheckRequest(BaseModel):
    marks_percentage: float = Field(..., ge=0.0, le=100.0)
    is_pvtg: bool = False


class RenewalCheckResponse(BaseModel):
    marks_percentage: float
    is_pvtg: bool
    threshold_required: float
    renewal_eligible: bool
    remarks: str


class MeritObjectionCreate(BaseModel):
    objection_type: ObjectionType
    description: str
    claimed_score: Optional[float] = None
    supporting_doc_url: Optional[str] = None


class MeritObjectionResolve(BaseModel):
    status_decision: ObjectionStatus
    resolution_remarks: str


class MeritObjectionResponse(BaseModel):
    id: str
    allocation_cycle_id: str
    student_id: str
    application_id: str
    objection_type: ObjectionType
    description: str
    claimed_score: Optional[float] = None
    status: ObjectionStatus
    resolution_remarks: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SanctionOrderResponse(BaseModel):
    id: str
    order_number: str
    allocation_cycle_id: str
    scheme_id: str
    financial_year: str
    total_beneficiaries: int
    total_sanctioned_amount: float
    digital_signature_hash: str
    pdf_path: Optional[str] = None
    issued_at: datetime

    class Config:
        from_attributes = True


class AllocationAuditResponse(BaseModel):
    id: str
    allocation_cycle_id: str
    event_type: str
    details_json: Optional[str] = None
    performed_by: str
    timestamp: datetime

    class Config:
        from_attributes = True
