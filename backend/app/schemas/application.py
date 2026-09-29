from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.schemas.scheme import SchemeResponse

class SaveDraftRequest(BaseModel):
    scheme_id: str
    current_step: int = 1
    draft_data: Dict[str, Any]

class DraftResponse(BaseModel):
    id: str
    scheme_id: str
    current_step: int
    draft_data: Dict[str, Any]
    last_saved_at: datetime

    class Config:
        from_attributes = True

class SubmitApplicationRequest(BaseModel):
    scheme_id: str
    academic_year: str = "2026-2027"
    application_data: Dict[str, Any]

class MultiApplyRequest(BaseModel):
    scheme_ids: List[str]
    academic_year: str = "2026-2027"
    shared_application_data: Dict[str, Any]

class WithdrawApplicationRequest(BaseModel):
    reason: str

class ApplicationTimelineResponse(BaseModel):
    id: str
    stage: str
    title: str
    description: Optional[str] = None
    actor_role: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: str
    application_number: str
    student_id: str
    scheme_id: str
    academic_year: str
    status: str
    is_locked: bool
    submission_date: Optional[datetime] = None
    application_data: Dict[str, Any]
    withdrawal_reason: Optional[str] = None
    withdrawn_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    cloned_from_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    scheme: Optional[SchemeResponse] = None
    timeline_events: List[ApplicationTimelineResponse] = []

    class Config:
        from_attributes = True
