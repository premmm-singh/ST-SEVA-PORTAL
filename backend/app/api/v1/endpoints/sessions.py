from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.session import SessionModel, LoginActivity
from app.schemas.session import SessionResponse, LoginActivityResponse
from app.core.audit import record_audit_log

router = APIRouter()

@router.get("/active", response_model=List[SessionResponse])
def list_active_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Feature 9 & 10: List all active devices and sessions for user."""
    sessions = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id,
        SessionModel.is_revoked == False
    ).order_by(SessionModel.last_active_at.desc()).all()
    
    return [
        SessionResponse(
            id=s.id,
            device_name=s.device_name,
            ip_address=s.ip_address,
            location_estimate=s.location_estimate,
            is_current=False,
            last_active_at=s.last_active_at,
            created_at=s.created_at
        )
        for s in sessions
    ]

@router.delete("/{session_id}")
def revoke_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Feature 10: Revoke a specific active device session."""
    session_rec = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session_rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    session_rec.is_revoked = True
    db.commit()
    
    record_audit_log(
        db, action="SESSION_REVOKED", resource_type="SESSION",
        user_id=current_user.id, resource_id=session_id,
        details={"revoked_device": session_rec.device_name}
    )
    
    return {"message": f"Session on {session_rec.device_name} successfully revoked."}

@router.delete("/revoke-others/all")
def revoke_other_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Feature 10: Revoke all other active device sessions."""
    # Find most recently active session to keep
    active = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id,
        SessionModel.is_revoked == False
    ).order_by(SessionModel.last_active_at.desc()).all()
    
    if len(active) > 1:
        current_id = active[0].id
        for s in active[1:]:
            s.is_revoked = True
        db.commit()
        
    return {"message": "All other device sessions have been terminated."}

@router.get("/history", response_model=List[LoginActivityResponse])
def get_login_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Feature 13: Login activity audit trail with IP, device, and location."""
    activities = db.query(LoginActivity).filter(
        LoginActivity.user_id == current_user.id
    ).order_by(LoginActivity.created_at.desc()).limit(20).all()
    
    return activities
