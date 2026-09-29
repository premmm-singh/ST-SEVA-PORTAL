import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class MerkleAuditNode(Base):
    __tablename__ = "merkle_audit_nodes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tree_index = Column(Integer, nullable=False, index=True)
    block_height = Column(Integer, nullable=False, default=1, index=True)
    entity_type = Column(String(50), nullable=False) # 'SANCTION_ORDER', 'DBT_TRANSACTION', 'ADMIN_DELEGATION'
    record_id = Column(String(100), nullable=False, index=True)
    leaf_hash = Column(String(64), nullable=False, index=True)
    parent_hash = Column(String(64), nullable=True)
    root_hash = Column(String(64), nullable=False, index=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class VaptScanReport(Base):
    __tablename__ = "vapt_scan_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_type = Column(String(50), default="AUTOMATED_DAST", nullable=False) # 'AUTOMATED_DAST', 'CERT_IN_AUDIT', 'OWASP_TOP_10'
    target_component = Column(String(100), default="PORTAL_API_CORE", nullable=False)
    total_checks = Column(Integer, default=50)
    passed_checks = Column(Integer, default=49)
    failed_checks = Column(Integer, default=1)
    cert_in_score = Column(Float, default=98.5) # out of 100
    findings = Column(JSON, default=list)
    remediation_plan = Column(Text, nullable=True)
    scanned_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scanned_by_user = relationship("User")


class SessionAnomalyLog(Base):
    __tablename__ = "session_anomaly_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=True)
    anomaly_type = Column(String(50), nullable=False) # 'IP_ROAMING_JUMP', 'ASN_MISMATCH', 'USER_AGENT_SWAP'
    risk_score = Column(Float, default=75.0) # 0 to 100
    previous_ip = Column(String(50), nullable=True)
    current_ip = Column(String(50), nullable=False)
    previous_city = Column(String(100), default="Ranchi")
    current_city = Column(String(100), default="Frankfurt")
    action_taken = Column(String(50), default="REQUIRE_MFA_STEP_UP") # 'REQUIRE_MFA_STEP_UP', 'SESSION_TERMINATED', 'FLAGGED_MONITOR'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
