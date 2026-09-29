from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.db.models.analytics import SessionType

class ExecutiveOverviewResponse(BaseModel):
    financial_year: str
    total_applications: int
    institute_verified: int
    dwo_approved: int
    sanctioned_beneficiaries: int
    total_disbursed_amount: float
    total_disbursed_crores: float
    pvtg_beneficiaries_count: int
    female_beneficiaries_count: int
    female_representation_pct: float
    active_grievances_count: int
    sla_compliance_pct: float

class DistrictHeatmapItem(BaseModel):
    district_name: str
    total_applications: int
    total_disbursed_amount: float
    avg_tat_days: float
    pvtg_count: int
    active_institutions: int
    saturation_rate: float
    female_ratio: float

class DistrictHeatmapResponse(BaseModel):
    financial_year: str
    districts: List[DistrictHeatmapItem]

class TribalSubCasteMetric(BaseModel):
    sub_caste: str
    total_students: int
    percentage: float
    is_pvtg: bool

class DemographicBreakdownResponse(BaseModel):
    total_st_beneficiaries: int
    sub_castes: List[TribalSubCasteMetric]
    pvtg_summary: Dict[str, Any]

class BudgetSchemeOutlay(BaseModel):
    scheme_code: str
    scheme_name: str
    scheme_type: str
    allocated_amount: float
    disbursed_amount: float
    utilization_pct: float

class BudgetUtilizationResponse(BaseModel):
    financial_year: str
    total_budget_allocated: float
    total_disbursed_amount: float
    overall_utilization_pct: float
    central_share_disbursed: float
    state_share_disbursed: float
    remaining_balance: float
    schemes: List[BudgetSchemeOutlay]

class ScrutinyStageTat(BaseModel):
    stage: str
    average_days: float
    statutory_sla_days: int
    status: str

class ScrutinyTatResponse(BaseModel):
    overall_avg_tat_days: float
    stages: List[ScrutinyStageTat]
    bottleneck_districts: List[Dict[str, Any]]

class InstitutionLeagueItem(BaseModel):
    aishe_code: str
    name: str
    district: str
    total_applications: int
    verified_count: int
    avg_tat_days: float
    verification_rate_pct: float
    status: str

class InstitutionLeagueResponse(BaseModel):
    top_performers: List[InstitutionLeagueItem]
    defaulters: List[InstitutionLeagueItem]

class DbtHealthAnalyticsResponse(BaseModel):
    total_transactions: int
    success_rate_pct: float
    success_count: int
    failed_count: int
    failure_reasons: Dict[str, int]
    avg_pfms_credit_hours: float

class ParliamentQuestionExportRequest(BaseModel):
    question_reference_no: str
    session_type: SessionType = SessionType.LOK_SABHA
    export_title: str
    financial_year: str = "2026-2027"
    export_format: str = "CSV"
    district: Optional[str] = None
    scheme_id: Optional[str] = None

class ParliamentQuestionExportResponse(BaseModel):
    id: str
    question_reference_no: str
    session_type: SessionType
    export_title: str
    financial_year: str
    export_format: str
    record_count: int
    export_data: Optional[str] = None
    sha256_hash: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BudgetForecastResponse(BaseModel):
    current_year: str
    forecast_year: str
    projected_applications: int
    projected_budget_required_crores: float
    expected_growth_pct: float
    model_method: str
    confidence_interval_low_cr: float
    confidence_interval_high_cr: float

class ScheduledReportCreateRequest(BaseModel):
    report_title: str
    recipient_role: str = "CHIEF_SECRETARY"
    recipient_email: str
    frequency: str = "WEEKLY"

class ScheduledReportResponse(BaseModel):
    id: str
    report_title: str
    recipient_role: str
    recipient_email: str
    frequency: str
    is_active: bool
    last_dispatched_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
