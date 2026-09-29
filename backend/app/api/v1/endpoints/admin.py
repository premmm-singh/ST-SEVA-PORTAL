from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.api.deps import get_current_user, require_roles
from app.services.admin_service import AdminService
from app.schemas.admin import (
    RolePermissionCreate,
    RolePermissionResponse,
    OfficerDelegationCreate,
    OfficerDelegationResponse,
    SystemConfigUpdate,
    SystemConfigResponse,
    AuditTrailResponse,
    ImpersonationStartRequest,
    ImpersonationResponse,
    TenantConfigUpdate,
    TenantConfigResponse,
    SystemHealthResponse,
    RetentionPurgeRequest,
    RetentionPurgeResponse
)

router = APIRouter()

ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN]
OFFICER_ADMIN_ROLES = [UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]

# F-119: Hierarchical Role-Based Access Control (RBAC) Matrix
@router.get("/rbac/matrix", response_model=List[RolePermissionResponse])
def get_rbac_matrix(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
) -> Any:
    return AdminService.get_rbac_matrix(db)

@router.post("/rbac/permissions", response_model=RolePermissionResponse, status_code=status.HTTP_201_CREATED)
def set_role_permission(
    payload: RolePermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
) -> Any:
    return AdminService.create_or_update_role_permission(
        db=db,
        role=payload.role,
        resource=payload.resource,
        permission=payload.permission,
        scope=payload.scope,
        description=payload.description
    )

# F-121: District & Taluk Hierarchy & Officer Transfer / Delegation Workflow
@router.post("/delegations", response_model=OfficerDelegationResponse, status_code=status.HTTP_201_CREATED)
def create_delegation(
    payload: OfficerDelegationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    return AdminService.create_officer_delegation(
        db=db,
        delegator_id=current_user.id,
        delegatee_id=payload.delegatee_id,
        district=payload.district,
        role_delegated=payload.role_delegated,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        reason=payload.reason
    )

@router.get("/delegations/active", response_model=List[OfficerDelegationResponse])
def get_active_delegations(
    district: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    return AdminService.get_active_delegations(db=db, district=district)

@router.post("/delegations/{delegation_id}/revoke", response_model=OfficerDelegationResponse)
def revoke_delegation(
    delegation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    delegation = AdminService.revoke_delegation(db=db, delegation_id=delegation_id, revoker_id=current_user.id)
    if not delegation:
        raise HTTPException(status_code=404, detail="Delegation record not found.")
    return delegation

# F-122: System Configuration Registry & Dynamic Parameter Tuning
@router.get("/configs", response_model=List[SystemConfigResponse])
def get_system_configs(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
) -> Any:
    return AdminService.get_system_configs(db=db, category=category)

@router.put("/configs/{config_key}", response_model=SystemConfigResponse)
def update_system_config(
    config_key: str,
    payload: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
) -> Any:
    cfg = AdminService.update_system_config(
        db=db,
        config_key=config_key,
        config_value=payload.config_value,
        user_id=current_user.id,
        description=payload.description
    )
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Configuration parameter '{config_key}' not found.")
    return cfg

# F-124: Audit Trail Log Explorer with Immutable SHA-256 Checksums
@router.get("/audit-trail", response_model=AuditTrailResponse)
def get_audit_trail(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    resource: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
) -> Any:
    return AdminService.get_audit_trail_explorer(
        db=db,
        limit=limit,
        offset=offset,
        resource=resource
    )

# F-125: Super-Admin Officer Impersonation / Shadow Mode
@router.post("/impersonate/start", response_model=ImpersonationResponse)
def start_impersonation(
    payload: ImpersonationStartRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
) -> Any:
    try:
        client_ip = request.client.host if request.client else "127.0.0.1"
        return AdminService.start_impersonation(
            db=db,
            admin_user_id=current_user.id,
            target_user_id=payload.target_user_id,
            justification=payload.justification,
            read_only=payload.read_only,
            ip_address=client_ip
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# F-126: Multi-Tenant Architecture & State White-Labeling
@router.get("/tenant-config", response_model=TenantConfigResponse)
def get_tenant_config(
    state_code: str = "JH",
    db: Session = Depends(get_db)
) -> Any:
    return AdminService.get_tenant_state_config(db=db, state_code=state_code)

@router.put("/tenant-config", response_model=TenantConfigResponse)
def update_tenant_config(
    payload: TenantConfigUpdate,
    state_code: str = "JH",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
) -> Any:
    return AdminService.update_tenant_state_config(
        db=db,
        state_code=state_code,
        payload_dict=payload.model_dump(exclude_unset=True)
    )

# F-127: System Health, Server Metrics & Uptime Monitoring Dashboard
@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    return AdminService.get_system_health_telemetry(db=db)

# F-128: Data Purging, GDPR/DPDP Act 2023 Compliance & Retention Policy
@router.post("/retention/run-purge", response_model=RetentionPurgeResponse)
def execute_retention_purge(
    payload: RetentionPurgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
) -> Any:
    return AdminService.execute_retention_purge(
        db=db,
        entity_type=payload.entity_type,
        dry_run=payload.dry_run
    )
