from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.db.models.admin import PermissionScope, ConfigDataType

# F-119: Hierarchical Role-Based Access Control (RBAC) Matrix
class RolePermissionCreate(BaseModel):
    role: str
    resource: str
    permission: str # READ, WRITE, APPROVE, DISBURSE, AUDIT, PURGE
    scope: PermissionScope = PermissionScope.DISTRICT
    description: Optional[str] = None

class RolePermissionResponse(BaseModel):
    id: str
    role: str
    resource: str
    permission: str
    scope: PermissionScope
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# F-121: District & Taluk Hierarchy & Officer Transfer / Delegation
class OfficerDelegationCreate(BaseModel):
    delegatee_id: str
    district: str
    role_delegated: str = "DWO"
    valid_from: datetime
    valid_to: datetime
    reason: str

class OfficerDelegationResponse(BaseModel):
    id: str
    delegator_id: str
    delegatee_id: str
    district: str
    role_delegated: str
    valid_from: datetime
    valid_to: datetime
    reason: str
    is_active: bool
    revoked_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# F-122: System Configuration Registry & Dynamic Parameter Tuning
class SystemConfigUpdate(BaseModel):
    config_value: str
    description: Optional[str] = None

class SystemConfigResponse(BaseModel):
    id: str
    config_key: str
    config_value: str
    data_type: ConfigDataType
    category: str
    description: Optional[str]
    is_sensitive: bool
    updated_at: datetime

    class Config:
        from_attributes = True

# F-124: Audit Trail Log Explorer with Immutable SHA-256 Checksums
class AuditTrailRecord(BaseModel):
    id: str
    timestamp: datetime
    user_id: Optional[str]
    user_role: Optional[str]
    action: str
    resource: str
    resource_id: Optional[str]
    ip_address: Optional[str]
    status: str
    sha256_hash: str
    details: Optional[Dict[str, Any]] = None

class AuditTrailResponse(BaseModel):
    total_records: int
    chain_verified: bool
    records: List[AuditTrailRecord]

# F-125: Super-Admin Officer Impersonation / Shadow Mode
class ImpersonationStartRequest(BaseModel):
    target_user_id: str
    justification: str
    read_only: bool = True

class ImpersonationResponse(BaseModel):
    session_id: str
    target_user_id: str
    target_user_email: str
    target_user_role: str
    session_token: str
    read_only: bool
    started_at: datetime
    is_active: bool

# F-126: Multi-Tenant Architecture & State White-Labeling
class TenantConfigUpdate(BaseModel):
    portal_title: Optional[str] = None
    primary_color: Optional[str] = None
    helpline_phone: Optional[str] = None
    helpline_email: Optional[str] = None
    default_language: Optional[str] = None

class TenantConfigResponse(BaseModel):
    id: str
    state_code: str
    state_name: str
    portal_title: str
    state_emblem_url: Optional[str]
    primary_color: str
    helpline_phone: str
    helpline_email: str
    portal_domain: str
    default_language: str
    is_active: bool

    class Config:
        from_attributes = True

# F-127: System Health, Server Metrics & Uptime Monitoring Dashboard
class ServiceHealthProbe(BaseModel):
    service_name: str
    status: str # HEALTHY, DEGRADED, DOWN
    latency_ms: float
    last_checked: datetime
    details: Optional[str] = None

class SystemHealthResponse(BaseModel):
    portal_status: str
    uptime_percentage: float
    db_pool_active_connections: int
    db_pool_available_connections: int
    cache_hit_ratio_pct: float
    api_p95_latency_ms: float
    background_queue_depth: int
    server_time_utc: datetime
    services: List[ServiceHealthProbe]

# F-128: Data Purging, GDPR/DPDP Act 2023 Compliance & Retention Policy
class RetentionPurgeRequest(BaseModel):
    entity_type: str # APPLICATION, DOCUMENT, AUDIT_LOG
    dry_run: bool = True

class RetentionPurgeResponse(BaseModel):
    entity_type: str
    retention_period_years: int
    dry_run: bool
    eligible_records_count: int
    purged_records_count: int
    compliant_act: str
    purged_at: datetime
    certificate_id: str
