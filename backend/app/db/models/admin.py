from datetime import datetime, timezone
import enum
import uuid
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Text
)
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class PermissionScope(str, enum.Enum):
    NATIONAL = "NATIONAL"
    STATE = "STATE"
    DISTRICT = "DISTRICT"
    INSTITUTION = "INSTITUTION"
    OWN = "OWN"

class ConfigDataType(str, enum.Enum):
    STRING = "STRING"
    INTEGER = "INTEGER"
    FLOAT = "FLOAT"
    BOOLEAN = "BOOLEAN"
    JSON = "JSON"

class RolePermissionMatrix(Base):
    """F-119: Hierarchical Role-Based Access Control (RBAC) Matrix."""
    __tablename__ = "admin_role_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role = Column(String(64), nullable=False, index=True)
    resource = Column(String(64), nullable=False, index=True)
    permission = Column(String(32), nullable=False) # READ, WRITE, APPROVE, DISBURSE, AUDIT, PURGE
    scope = Column(SQLEnum(PermissionScope), default=PermissionScope.DISTRICT, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

class OfficerDelegation(Base):
    """F-121: District & Taluk Hierarchy & Officer Transfer / Delegation Workflow."""
    __tablename__ = "admin_officer_delegations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    delegator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    delegatee_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    district = Column(String(64), nullable=False, index=True)
    role_delegated = Column(String(64), default="DWO", nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    reason = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class SystemConfigRegistry(Base):
    """F-122: System Configuration Registry & Dynamic Parameter Tuning."""
    __tablename__ = "admin_system_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    config_key = Column(String(100), unique=True, nullable=False, index=True)
    config_value = Column(Text, nullable=False)
    data_type = Column(SQLEnum(ConfigDataType), default=ConfigDataType.STRING, nullable=False)
    category = Column(String(64), default="GENERAL", index=True) # GENERAL, SLA, SCRUTINY, DBT, SECURITY
    description = Column(String(255), nullable=True)
    is_sensitive = Column(Boolean, default=False)
    updated_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

class ImpersonationSession(Base):
    """F-125: Super-Admin Officer Impersonation / Shadow Mode."""
    __tablename__ = "admin_impersonation_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    admin_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    target_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    justification = Column(String(255), nullable=False)
    session_token = Column(String(128), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    read_only = Column(Boolean, default=True)
    ip_address = Column(String(45), nullable=True)
    started_at = Column(DateTime, default=get_utc_now)
    ended_at = Column(DateTime, nullable=True)

class TenantStateConfig(Base):
    """F-126: Multi-Tenant Architecture & State White-Labeling."""
    __tablename__ = "admin_tenant_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    state_code = Column(String(8), unique=True, nullable=False, index=True) # e.g. "JH" for Jharkhand
    state_name = Column(String(100), nullable=False)
    portal_title = Column(String(200), nullable=False)
    state_emblem_url = Column(String(255), nullable=True)
    primary_color = Column(String(16), default="#005696")
    helpline_phone = Column(String(32), default="1800-345-6543")
    helpline_email = Column(String(100), default="helpdesk.welfare@jharkhand.gov.in")
    portal_domain = Column(String(128), default="ekalyan.jharkhand.gov.in")
    default_language = Column(String(16), default="hi")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

class RetentionPurgePolicy(Base):
    """F-128: Data Purging, GDPR/DPDP Act 2023 Compliance & Retention Policy."""
    __tablename__ = "admin_retention_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(64), nullable=False, index=True) # APPLICATION, DOCUMENT, AUDIT_LOG, GRIEVANCE
    retention_period_years = Column(Integer, default=7, nullable=False)
    compliant_act = Column(String(128), default="Digital Personal Data Protection Act 2023")
    last_run_at = Column(DateTime, nullable=True)
    total_purged_records = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
