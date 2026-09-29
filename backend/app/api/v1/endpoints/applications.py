import secrets
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User, UserRole
from app.db.models.scheme import Scheme
from app.db.models.application import Application, ApplicationDraft, ApplicationTimeline
from app.schemas.application import (
    SaveDraftRequest, DraftResponse, SubmitApplicationRequest,
    ApplicationResponse, MultiApplyRequest, WithdrawApplicationRequest,
    ApplicationTimelineResponse
)
from app.services.pdf_service import ApplicationPdfService
from app.core.audit import record_audit_log

router = APIRouter()

def _generate_tracking_number() -> str:
    """Generates an official tracking number: ST-2026-XXXXXX"""
    return f"ST-2026-{secrets.token_hex(3).upper()}"

@router.post("/draft", response_model=DraftResponse)
def save_application_draft(
    req: SaveDraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Features 15 & 16: Save or auto-save application draft state."""
    draft = db.query(ApplicationDraft).filter(
        ApplicationDraft.student_id == current_user.id,
        ApplicationDraft.scheme_id == req.scheme_id
    ).first()
    
    if not draft:
        draft = ApplicationDraft(
            student_id=current_user.id,
            scheme_id=req.scheme_id,
            current_step=req.current_step,
            draft_data=req.draft_data
        )
        db.add(draft)
    else:
        draft.current_step = req.current_step
        draft.draft_data = req.draft_data
        draft.last_saved_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(draft)
    return draft

@router.get("/draft/{scheme_id}", response_model=DraftResponse)
def get_application_draft(
    scheme_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 15 & 17: Fetch existing draft for student."""
    draft = db.query(ApplicationDraft).filter(
        ApplicationDraft.student_id == current_user.id,
        ApplicationDraft.scheme_id == scheme_id
    ).first()
    
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active draft found for this scheme")
    return draft

@router.post("/submit", response_model=ApplicationResponse)
def submit_final_application(
    req: SubmitApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 19: Final submission — lock application, generate tracking ID, and create timeline event."""
    scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
        
    tracking_number = _generate_tracking_number()
    now = datetime.now(timezone.utc)
    
    application = Application(
        application_number=tracking_number,
        student_id=current_user.id,
        scheme_id=req.scheme_id,
        academic_year=req.academic_year,
        status="SUBMITTED",
        is_locked=True,
        submission_date=now,
        application_data=req.application_data
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # Create Initial Timeline Event
    timeline_event = ApplicationTimeline(
        application_id=application.id,
        stage="APPLICATION_SUBMITTED",
        title="Application Successfully Submitted",
        description=f"Form submitted for {scheme.scheme_name}. Tracking ID {tracking_number} allocated.",
        actor_role="STUDENT"
    )
    db.add(timeline_event)
    
    # Remove any draft for this scheme
    db.query(ApplicationDraft).filter(
        ApplicationDraft.student_id == current_user.id,
        ApplicationDraft.scheme_id == req.scheme_id
    ).delete()
    
    db.commit()
    db.refresh(application)
    
    record_audit_log(
        db, action="APPLICATION_SUBMITTED", resource_type="APPLICATION",
        user_id=current_user.id, resource_id=application.id,
        details={"tracking_number": tracking_number, "scheme": scheme.scheme_name}
    )
    
    return application

@router.get("", response_model=List[ApplicationResponse])
def list_student_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 14 & 21: List all applications submitted by active student."""
    applications = db.query(Application).filter(
        Application.student_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    return applications

@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 18: Application Preview & Read-only review."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
    if current_user.role == UserRole.STUDENT and application.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    return application

@router.put("/{app_id}", response_model=ApplicationResponse)
def update_draft_application(
    app_id: str,
    req: SubmitApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 17: Edit application before final submission."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
    if application.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    if application.is_locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application is locked and cannot be edited")
        
    application.application_data = req.application_data
    db.commit()
    db.refresh(application)
    return application

@router.post("/{app_id}/clone", response_model=ApplicationResponse)
def clone_application(
    app_id: str,
    target_scheme_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 20: Application Cloning — copy previous application as base for another scheme."""
    source_app = db.query(Application).filter(Application.id == app_id).first()
    if not source_app or source_app.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source application not found")
        
    target_scheme = db.query(Scheme).filter(Scheme.id == target_scheme_id).first()
    if not target_scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target scheme not found")
        
    tracking_number = _generate_tracking_number()
    cloned_app = Application(
        application_number=tracking_number,
        student_id=current_user.id,
        scheme_id=target_scheme_id,
        academic_year=source_app.academic_year,
        status="DRAFT",
        is_locked=False,
        application_data=source_app.application_data.copy(),
        cloned_from_id=source_app.id
    )
    db.add(cloned_app)
    db.commit()
    db.refresh(cloned_app)
    
    db.add(ApplicationTimeline(
        application_id=cloned_app.id,
        stage="DRAFT_SAVED",
        title="Application Cloned",
        description=f"Cloned details from previous application {source_app.application_number} as draft base.",
        actor_role="STUDENT"
    ))
    db.commit()
    
    return cloned_app

@router.post("/multi-apply")
def multi_scheme_application(
    req: MultiApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 21: Multi-scheme Application — apply to multiple schemes in one session."""
    created_apps = []
    now = datetime.now(timezone.utc)
    
    for scheme_id in req.scheme_ids:
        scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not scheme:
            continue
        tracking_num = _generate_tracking_number()
        app_record = Application(
            application_number=tracking_num,
            student_id=current_user.id,
            scheme_id=scheme_id,
            academic_year=req.academic_year,
            status="SUBMITTED",
            is_locked=True,
            submission_date=now,
            application_data=req.shared_application_data
        )
        db.add(app_record)
        db.commit()
        db.refresh(app_record)
        
        db.add(ApplicationTimeline(
            application_id=app_record.id,
            stage="APPLICATION_SUBMITTED",
            title=f"Multi-Scheme Submission: {scheme.scheme_name}",
            description=f"Batch submitted application with tracking ID {tracking_num}.",
            actor_role="STUDENT"
        ))
        db.commit()
        created_apps.append({
            "tracking_number": tracking_num,
            "scheme_id": scheme_id,
            "scheme_name": scheme.scheme_name
        })
        
    return {
        "message": f"Successfully applied to {len(created_apps)} schemes in batch.",
        "applications": created_apps
    }

@router.get("/{app_id}/timeline", response_model=List[ApplicationTimelineResponse])
def get_application_timeline(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 23: Application Status Timeline — visual chronological history of status changes."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
    timeline = db.query(ApplicationTimeline).filter(
        ApplicationTimeline.application_id == app_id
    ).order_by(ApplicationTimeline.created_at.asc()).all()
    
    return timeline

@router.get("/{app_id}/export-pdf")
def export_application_pdf(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 24: Download Submitted Form — export official application copy as PDF document."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
    scheme_name = application.scheme.scheme_name if application.scheme else "ST Scholarship Scheme"
    pdf_bytes = ApplicationPdfService.generate_application_pdf(
        app_data=application.application_data,
        scheme_name=scheme_name,
        app_number=application.application_number
    )
    
    filename = f"Application_{application.application_number}.txt"
    return Response(
        content=pdf_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/{app_id}/withdraw")
def withdraw_application(
    app_id: str,
    req: WithdrawApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 25: Application Withdrawal — withdraw application before approval with reason."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application or application.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
    if application.status in ["APPROVED", "WITHDRAWN"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot withdraw application in status {application.status}")
        
    application.status = "WITHDRAWN"
    application.withdrawal_reason = req.reason
    application.withdrawn_at = datetime.now(timezone.utc)
    
    db.add(ApplicationTimeline(
        application_id=application.id,
        stage="WITHDRAWN",
        title="Application Withdrawn by Applicant",
        description=f"Reason: {req.reason}",
        actor_role="STUDENT"
    ))
    db.commit()
    
    record_audit_log(
        db, action="APPLICATION_WITHDRAWN", resource_type="APPLICATION",
        user_id=current_user.id, resource_id=application.id,
        details={"reason": req.reason}
    )
    
    return {"message": f"Application {application.application_number} successfully withdrawn."}

@router.post("/{app_id}/reapply", response_model=ApplicationResponse)
def reapply_application(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 26: Re-application Support — reapply after rejection with previous data pre-filled."""
    old_app = db.query(Application).filter(Application.id == app_id).first()
    if not old_app or old_app.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Previous application not found")
        
    tracking_number = _generate_tracking_number()
    new_app = Application(
        application_number=tracking_number,
        student_id=current_user.id,
        scheme_id=old_app.scheme_id,
        academic_year=old_app.academic_year,
        status="DRAFT",
        is_locked=False,
        application_data=old_app.application_data.copy(),
        cloned_from_id=old_app.id
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    
    db.add(ApplicationTimeline(
        application_id=new_app.id,
        stage="DRAFT_SAVED",
        title="Re-application Draft Created",
        description=f"Pre-filled from previous application {old_app.application_number} with previous rejection notes addressed.",
        actor_role="STUDENT"
    ))
    db.commit()
    
    return new_app
