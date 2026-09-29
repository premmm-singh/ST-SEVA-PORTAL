from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.db.models.grievance import (
    GrievanceCategory,
    GrievanceStatus,
    GrievancePriority,
    HearingMode
)

class GrievanceCreateRequest(BaseModel):
    subject: str
    description: str
    category: GrievanceCategory = GrievanceCategory.OTHER
    application_id: Optional[str] = None
    district: str = "Ranchi"
    evidence_document_url: Optional[str] = None
    priority: GrievancePriority = GrievancePriority.MEDIUM

class GrievanceActionRequest(BaseModel):
    action: str  # ASSIGN, IN_REVIEW, RESOLVE, CLOSE, ESCALATE
    remarks: str
    assigned_officer_id: Optional[str] = None
    resolution_summary: Optional[str] = None
    action_taken_report: Optional[str] = None
    atr_digital_seal: Optional[str] = None

class GrievanceHearingScheduleRequest(BaseModel):
    scheduled_at: datetime
    mode: HearingMode = HearingMode.VIRTUAL_MEETING
    venue_or_link: str
    hearing_notes: Optional[str] = None

class GrievanceHearingUpdateRequest(BaseModel):
    attended_by_complainant: Optional[bool] = None
    hearing_notes: Optional[str] = None
    status: str = "COMPLETED"

class GrievanceAppealRequest(BaseModel):
    appeal_reason: str

class GrievanceTimelineResponse(BaseModel):
    id: str
    action: str
    remarks: str
    actor_id: Optional[str] = None
    actor_name: str
    actor_role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GrievanceHearingResponse(BaseModel):
    id: str
    scheduled_at: datetime
    mode: HearingMode
    venue_or_link: str
    hearing_notes: Optional[str] = None
    attended_by_complainant: Optional[bool] = None
    conducted_by_officer_id: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GrievanceResponse(BaseModel):
    id: str
    ticket_number: str
    complainant_user_id: str
    application_id: Optional[str] = None
    category: GrievanceCategory
    subject: str
    description: str
    district: str
    evidence_document_url: Optional[str] = None
    status: GrievanceStatus
    priority: GrievancePriority
    tier_level: int
    assigned_officer_id: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    is_sla_breached: bool
    resolution_summary: Optional[str] = None
    action_taken_report: Optional[str] = None
    atr_digital_seal: Optional[str] = None
    external_source: Optional[str] = None
    external_reference_id: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    timelines: List[GrievanceTimelineResponse] = []
    hearings: List[GrievanceHearingResponse] = []

    model_config = ConfigDict(from_attributes=True)

class GrievanceListResponse(BaseModel):
    total: int
    items: List[GrievanceResponse]

class HelpdeskArticleResponse(BaseModel):
    id: str
    category: str
    question: str
    answer: str
    tags: str
    view_count: int
    helpful_count: int
    is_published: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HelpdeskArticleCreateRequest(BaseModel):
    category: str
    question: str
    answer: str
    tags: str = ""

class ExternalGrievanceSyncRequest(BaseModel):
    external_source: str = "CPGRAMS"  # CPGRAMS or JANSAMVAD
    external_reference_id: str
    subject: str
    description: str
    category: GrievanceCategory = GrievanceCategory.OTHER
    district: str = "Ranchi"
    complainant_phone: Optional[str] = None

class WhatsAppGrievanceBotRequest(BaseModel):
    phone_number: str
    message_text: str

class GrievanceAnalyticsResponse(BaseModel):
    total_grievances: int
    resolved_count: int
    in_review_count: int
    escalated_count: int
    hearing_scheduled_count: int
    sla_breached_count: int
    sla_compliance_rate: float
    avg_resolution_hours: float
    district_breakdown: Dict[str, int]
    category_breakdown: Dict[str, int]
    tier_distribution: Dict[str, int]
