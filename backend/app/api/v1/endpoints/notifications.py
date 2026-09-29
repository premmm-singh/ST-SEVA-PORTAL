from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.api.deps import get_current_user, require_roles
from app.services.notification_service import NotificationService
from app.db.models.notification import (
    Notification,
    NotificationPreference,
    BroadcastCampaign,
    NotificationDispatchLog
)
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdateRequest,
    BroadcastCampaignRequest,
    BroadcastCampaignResponse,
    DlrWebhookPayload,
    TriggerEventRequest
)

router = APIRouter()

OFFICER_ROLES = [UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]

# ==========================================
# In-App Notifications (All Authenticated Users)
# ==========================================

@router.get("/my-notifications", response_model=NotificationListResponse)
def get_my_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-87: Retrieve user notifications with unread count."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    items = query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return {
        "unread_count": unread_count,
        "items": items
    }

@router.post("/{notification_id}/mark-read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-87: Mark individual notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    notif.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-87: Mark all user notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({
        Notification.is_read: True,
        Notification.read_at: datetime.now(timezone.utc)
    })
    db.commit()
    return {"message": "All notifications marked as read"}

# ==========================================
# Communication Preferences & DND (F-91)
# ==========================================

@router.get("/preferences", response_model=NotificationPreferenceResponse)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-91: Fetch student/officer channel preferences and DND hours."""
    return NotificationService.get_or_create_user_preferences(db, current_user.id)

@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_preferences(
    payload: NotificationPreferenceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-91: Update multi-channel toggles and preferred language."""
    updates = payload.model_dump(exclude_unset=True)
    return NotificationService.update_user_preferences(db, current_user.id, updates)

# ==========================================
# Bulk Broadcasts (F-89: Officers/Admin)
# ==========================================

@router.post("/broadcast", response_model=BroadcastCampaignResponse)
def dispatch_broadcast_campaign(
    payload: BroadcastCampaignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-89: Dispatch bulk broadcast alert to targeted student cohorts."""
    try:
        return NotificationService.send_bulk_broadcast(
            db=db,
            title=payload.title,
            message_text=payload.message_text,
            officer_id=current_user.id,
            target_district=payload.target_district,
            target_scheme_id=payload.target_scheme_id,
            target_role=payload.target_role,
            channels=payload.channels
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Broadcast failed: {str(e)}")

@router.get("/broadcasts", response_model=List[BroadcastCampaignResponse])
def list_broadcast_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """List historical broadcast campaigns."""
    return db.query(BroadcastCampaign).order_by(BroadcastCampaign.created_at.desc()).all()

# ==========================================
# Milestone Event Triggers & DLR Webhook
# ==========================================

@router.post("/trigger-event", response_model=NotificationResponse)
def trigger_event_notification(
    payload: TriggerEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-88: Manually trigger automated lifecycle event."""
    try:
        return NotificationService.trigger_milestone_notification(
            db=db,
            event_type=payload.event_type,
            user_id=payload.user_id,
            application_id=payload.application_id,
            context=payload.context
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhooks/dlr")
def ingest_dlr_webhook(
    payload: DlrWebhookPayload,
    db: Session = Depends(get_db)
) -> Any:
    """F-92: Webhook endpoint ingesting telecom delivery receipts."""
    log = NotificationService.process_dlr_webhook(
        db=db,
        gateway_ref_id=payload.gateway_ref_id,
        delivery_status=payload.delivery_status,
        dlr_code=payload.dlr_code,
        failure_reason=payload.failure_reason
    )
    if not log:
        return {"status": "IGNORED", "message": "Gateway reference ID not found"}
    return {"status": "SUCCESS", "dispatch_id": log.id, "delivery_status": log.delivery_status.value}

@router.post("/chasers/run")
def trigger_deadline_chasers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-93: Trigger critical deadline escalation chasers."""
    chaser_count = NotificationService.check_and_trigger_deadline_chasers(db)
    return {"message": f"Deadline chaser executed. Escalated {chaser_count} pending defects."}

# ==========================================
# TRAI DLT Compliance Audit Export (F-95)
# ==========================================

@router.get("/audit/trai-compliance")
def get_trai_compliance_export(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-95: Export statutory TRAI DLT delivery compliance logs."""
    return NotificationService.export_trai_compliance_logs(db)
