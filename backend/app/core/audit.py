import hashlib
import json
from sqlalchemy.orm import Session
from app.db.models.audit import AuditLog

def record_audit_log(
    db: Session,
    action: str,
    resource_type: str,
    user_id: str = None,
    resource_id: str = None,
    details: dict = None,
    ip_address: str = "127.0.0.1",
    user_agent: str = None
) -> AuditLog:
    """Records an audit log entry chained cryptographically to the preceding entry."""
    details = details or {}
    
    # Fetch last audit log to get previous_log_hash
    last_entry = db.query(AuditLog).order_by(AuditLog.created_at.desc()).first()
    previous_hash = last_entry.entry_hash if last_entry else "0" * 64
    
    # Calculate SHA-256 hash of this entry
    payload = f"{action}:{resource_type}:{user_id}:{resource_id}:{json.dumps(details, sort_keys=True, default=str)}:{previous_hash}"
    entry_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        previous_log_hash=previous_hash,
        entry_hash=entry_hash
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
