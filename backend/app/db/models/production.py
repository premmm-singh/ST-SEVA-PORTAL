import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, JSON, Boolean
from app.db.session import Base

class SystemPreflightCheck(Base):
    __tablename__ = "system_preflight_checks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    check_category = Column(String(50), nullable=False, index=True) # 'DATABASE', 'CACHE', 'CRYPTO_VAULT', 'STORAGE', 'GATEWAYS'
    component_name = Column(String(100), nullable=False)
    status = Column(String(20), default="PASSED", nullable=False) # 'PASSED', 'WARNING', 'FAILED'
    latency_ms = Column(Float, default=1.2)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class DisasterRecoveryLog(Base):
    __tablename__ = "disaster_recovery_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    drill_type = Column(String(50), nullable=False) # 'FAILOVER_SIMULATION', 'SNAPSHOT_BACKUP', 'WAL_RESTORE'
    primary_region = Column(String(50), default="State Data Centre (SDC) Ranchi")
    secondary_region = Column(String(50), default="National DR Centre (NDC) Hyderabad")
    rpo_seconds = Column(Float, default=0.0) # Zero data loss
    rto_seconds = Column(Float, default=12.5) # Under 30 seconds
    status = Column(String(30), default="COMPLETED")
    backup_hash = Column(String(64), nullable=True)
    summary_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
