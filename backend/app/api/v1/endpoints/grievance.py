from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.api.deps import get_current_user, require_roles
from app.services.grievance_service import GrievanceService
from app.db.models.grievance import (
    Grievance,
    GrievanceHearing,
    HelpdeskArticle
)
from app.schemas.grievance import (
    GrievanceCreateRequest,
    GrievanceActionRequest,
    GrievanceHearingScheduleRequest,
    GrievanceHearingUpdateRequest,
    GrievanceAppealRequest,
    GrievanceResponse,
    GrievanceListResponse,
    GrievanceHearingResponse,
    HelpdeskArticleResponse,
    HelpdeskArticleCreateRequest,
    ExternalGrievanceSyncRequest,
    WhatsAppGrievanceBotRequest,
    GrievanceAnalyticsResponse
)

router = APIRouter()

OFFICER_ROLES = [UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]

# ==========================================
# Citizen / Complainant Endpoints
# ==========================================

@router.post("/", response_model=GrievanceResponse, status_code=status.HTTP_201_CREATED)
def file_grievance(
    payload: GrievanceCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-96: Beneficiary Grievance Registration & Statutory SLA Initialization."""
    try:
        grievance = GrievanceService.file_grievance(
            db=db,
            complainant_user_id=current_user.id,
            subject=payload.subject,
            description=payload.description,
            category=payload.category,
            application_id=payload.application_id,
            district=payload.district,
            evidence_document_url=payload.evidence_document_url,
            priority=payload.priority
        )
        return grievance
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to file grievance: {str(e)}"
        )

@router.get("/my-grievances", response_model=List[GrievanceResponse])
def get_my_grievances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List grievances submitted by the logged-in citizen."""
    return GrievanceService.get_my_grievances(db=db, user_id=current_user.id)

@router.get("/track/{ticket_number}", response_model=GrievanceResponse)
def track_public_grievance(
    ticket_number: str,
    db: Session = Depends(get_db)
) -> Any:
    """F-101: Public Grievance Tracker accessible without authentication."""
    grievance = GrievanceService.track_public_grievance(db=db, ticket_number=ticket_number)
    if not grievance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No grievance found with Ticket Number '{ticket_number}'. Please check the ID and try again."
        )
    return grievance

@router.get("/{grievance_id}", response_model=GrievanceResponse)
def get_grievance_by_id(
    grievance_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve full grievance details including timelines and hearings."""
    grievance = GrievanceService.get_grievance_by_id(db=db, grievance_id=grievance_id)
    if not grievance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grievance not found."
        )
    # Check authorization: user is complainant OR officer
    if grievance.complainant_user_id != current_user.id and current_user.role not in OFFICER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not authorized to view this grievance."
        )
    return grievance

@router.post("/{grievance_id}/appeal", status_code=status.HTTP_201_CREATED)
def file_grievance_appeal(
    grievance_id: str,
    payload: GrievanceAppealRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-103: Citizen Appeal Mechanism within statutory 15-day window."""
    try:
        appeal = GrievanceService.file_appeal(
            db=db,
            grievance_id=grievance_id,
            complainant_user_id=current_user.id,
            appeal_reason=payload.appeal_reason
        )
        return {"status": "SUCCESS", "message": "Appeal escalated to State Directorate (Tier 3).", "appeal_id": appeal.id}
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

# ==========================================
# Welfare Officer & Administration Endpoints
# ==========================================

@router.get("/officer/queue", response_model=List[GrievanceResponse])
def get_officer_queue(
    status_filter: Optional[str] = Query(None, alias="status"),
    tier_level: Optional[int] = None,
    district: Optional[str] = None,
    is_sla_breached: Optional[bool] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-98: Officer Grievance Redressal Desk queue with filters."""
    return GrievanceService.get_officer_queue(
        db=db,
        status=status_filter,
        tier_level=tier_level,
        district=district,
        is_sla_breached=is_sla_breached,
        priority=priority
    )

@router.post("/{grievance_id}/action", response_model=GrievanceResponse)
def take_officer_action(
    grievance_id: str,
    payload: GrievanceActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-102: Officer status update, ticket assignment, and ATR closure with digital seal."""
    try:
        grievance = GrievanceService.take_officer_action(
            db=db,
            grievance_id=grievance_id,
            officer=current_user,
            action=payload.action,
            remarks=payload.remarks,
            assigned_officer_id=payload.assigned_officer_id,
            resolution_summary=payload.resolution_summary,
            action_taken_report=payload.action_taken_report,
            atr_digital_seal=payload.atr_digital_seal
        )
        return grievance
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/{grievance_id}/schedule-hearing", response_model=GrievanceHearingResponse, status_code=status.HTTP_201_CREATED)
def schedule_dispute_hearing(
    grievance_id: str,
    payload: GrievanceHearingScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-100: Hearing appointment scheduler for formal dispute resolution."""
    try:
        hearing = GrievanceService.schedule_dispute_hearing(
            db=db,
            grievance_id=grievance_id,
            officer=current_user,
            scheduled_at=payload.scheduled_at,
            mode=payload.mode,
            venue_or_link=payload.venue_or_link,
            hearing_notes=payload.hearing_notes
        )
        return hearing
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/hearing/{hearing_id}/outcome", response_model=GrievanceHearingResponse)
def update_hearing_outcome(
    hearing_id: str,
    payload: GrievanceHearingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """Update attendance and notes from a formal hearing."""
    try:
        hearing = GrievanceService.update_hearing_outcome(
            db=db,
            hearing_id=hearing_id,
            officer=current_user,
            attended_by_complainant=payload.attended_by_complainant if payload.attended_by_complainant is not None else False,
            hearing_notes=payload.hearing_notes or "Hearing conducted as scheduled.",
            status=payload.status
        )
        return hearing
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/sla/run-escalations")
def run_sla_escalations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-99: Statutory SLA Timer & Multi-Tier Escalation Engine trigger."""
    return GrievanceService.run_sla_escalations(db=db)

# ==========================================
# Self-Help FAQ & Knowledgebase (Public & Officer)
# ==========================================

@router.get("/helpdesk/faq", response_model=List[HelpdeskArticleResponse])
def get_helpdesk_articles(
    query: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """F-104: AI-Powered Smart FAQ & Knowledgebase search."""
    return GrievanceService.get_helpdesk_articles(db=db, query_str=query, category=category)

@router.post("/helpdesk/faq/{article_id}/view")
def mark_article_view(
    article_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """Increment helpdesk article view count."""
    article = GrievanceService.mark_article_view(db=db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")
    return {"status": "SUCCESS", "view_count": article.view_count}

@router.post("/helpdesk/faq", response_model=HelpdeskArticleResponse, status_code=status.HTTP_201_CREATED)
def create_helpdesk_article(
    payload: HelpdeskArticleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """Add a new FAQ article to the knowledgebase."""
    now = datetime.now(timezone.utc)
    article = HelpdeskArticle(
        category=payload.category,
        question=payload.question,
        answer=payload.answer,
        tags=payload.tags,
        view_count=0,
        helpful_count=0,
        is_published=True,
        created_at=now
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article

# ==========================================
# External Channels & Executive Analytics
# ==========================================

@router.post("/whatsapp-bot")
def whatsapp_bot_interact(
    payload: WhatsAppGrievanceBotRequest,
    db: Session = Depends(get_db)
) -> Any:
    """F-105: WhatsApp Grievance Intake & Status Bot simulation."""
    return GrievanceService.whatsapp_bot_interact(
        db=db,
        phone_number=payload.phone_number,
        message_text=payload.message_text
    )

@router.post("/sync-external", response_model=GrievanceResponse, status_code=status.HTTP_201_CREATED)
def sync_external_grievance(
    payload: ExternalGrievanceSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-106: CPGRAMS & State Jansamvad Ingestion Adapter."""
    return GrievanceService.sync_external_grievance(
        db=db,
        external_source=payload.external_source,
        external_reference_id=payload.external_reference_id,
        subject=payload.subject,
        description=payload.description,
        category=payload.category,
        district=payload.district,
        complainant_phone=payload.complainant_phone
    )

@router.get("/analytics/dashboard", response_model=GrievanceAnalyticsResponse)
def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-107: Grievance Analytics, Heatmap & Officer Accountability Scorecard."""
    return GrievanceService.get_analytics_summary(db=db)
