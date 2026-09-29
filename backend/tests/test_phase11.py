import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.admin import PermissionScope
from app.core.security import create_access_token, hash_password

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def auth_tokens(db):
    unique = uuid4().hex[:6]
    
    # 1. Super Admin
    super_admin = User(
        email=f"super_admin_{unique}@gov.in",
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(super_admin)

    # 2. State Admin
    admin = User(
        email=f"state_admin_{unique}@jharkhand.gov.in",
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(admin)

    # 3. District Welfare Officer
    officer_1 = User(
        email=f"dwo_ranchi_{unique}@gov.in",
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    db.add(officer_1)

    # 4. Acting / Subordinate Officer
    officer_2 = User(
        email=f"acting_dwo_{unique}@gov.in",
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    db.add(officer_2)

    # 5. Student
    student = User(
        email=f"student_{unique}@gmail.com",
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db.add(student)

    db.commit()
    db.refresh(super_admin)
    db.refresh(admin)
    db.refresh(officer_1)
    db.refresh(officer_2)
    db.refresh(student)

    return {
        "super_admin": super_admin,
        "super_admin_headers": {"Authorization": f"Bearer {create_access_token(data={'sub': super_admin.id, 'email': super_admin.email, 'role': super_admin.role.value})}"},
        "admin": admin,
        "admin_headers": {"Authorization": f"Bearer {create_access_token(data={'sub': admin.id, 'email': admin.email, 'role': admin.role.value})}"},
        "officer_1": officer_1,
        "officer_1_headers": {"Authorization": f"Bearer {create_access_token(data={'sub': officer_1.id, 'email': officer_1.email, 'role': officer_1.role.value})}"},
        "officer_2": officer_2,
        "student": student,
        "student_headers": {"Authorization": f"Bearer {create_access_token(data={'sub': student.id, 'email': student.email, 'role': student.role.value})}"}
    }

def test_rbac_matrix_seeding_and_retrieval(auth_tokens):
    """F-119: Hierarchical Role-Based Access Control (RBAC) Matrix."""
    res = client.get("/api/v1/admin/rbac/matrix", headers=auth_tokens["admin_headers"])
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5

    roles = [p["role"] for p in data]
    assert "student" in roles
    assert "institution" in roles
    assert "officer" in roles
    assert "admin" in roles

def test_rbac_permission_create_and_override(auth_tokens):
    """F-119: Add or override granular resource permissions."""
    payload = {
        "role": "auditor",
        "resource": "sanction_orders",
        "permission": "READ_AUDIT",
        "scope": "STATE",
        "description": "Statutory state CAG audit inspection permission"
    }
    res = client.post("/api/v1/admin/rbac/permissions", json=payload, headers=auth_tokens["admin_headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["role"] == "auditor"
    assert data["resource"] == "sanction_orders"
    assert data["permission"] == "READ_AUDIT"
    assert data["scope"] == "STATE"

def test_officer_delegation_workflow(auth_tokens):
    """F-121: District & Taluk Hierarchy & Officer Transfer / Delegation Workflow."""
    now = datetime.now(timezone.utc)
    payload = {
        "delegatee_id": auth_tokens["officer_2"].id,
        "district": "Ranchi",
        "role_delegated": "DWO",
        "valid_from": now.isoformat(),
        "valid_to": (now + timedelta(days=14)).isoformat(),
        "reason": "Official medical leave coverage"
    }
    # Create delegation
    res = client.post("/api/v1/admin/delegations", json=payload, headers=auth_tokens["officer_1_headers"])
    assert res.status_code == 201
    delegation = res.json()
    assert delegation["district"] == "Ranchi"
    assert delegation["is_active"] is True
    delegation_id = delegation["id"]

    # Retrieve active delegations
    res = client.get("/api/v1/admin/delegations/active?district=Ranchi", headers=auth_tokens["officer_1_headers"])
    assert res.status_code == 200
    active_list = res.json()
    assert len(active_list) >= 1
    assert any(d["id"] == delegation_id for d in active_list)

    # Revoke delegation
    res = client.post(f"/api/v1/admin/delegations/{delegation_id}/revoke", headers=auth_tokens["officer_1_headers"])
    assert res.status_code == 200
    revoked = res.json()
    assert revoked["is_active"] is False
    assert revoked["revoked_at"] is not None

def test_system_config_registry(auth_tokens):
    """F-122: System Configuration Registry & Dynamic Parameter Tuning."""
    res = client.get("/api/v1/admin/configs", headers=auth_tokens["admin_headers"])
    assert res.status_code == 200
    configs = res.json()
    assert len(configs) >= 5

    # Filter by category
    res = client.get("/api/v1/admin/configs?category=SLA", headers=auth_tokens["admin_headers"])
    assert res.status_code == 200
    sla_configs = res.json()
    assert all(c["category"] == "SLA" for c in sla_configs)

    # Hot update a config parameter
    update_payload = {
        "config_value": "12",
        "description": "Accelerated institutional SLA for 2026-2027 cycle"
    }
    res = client.put(
        "/api/v1/admin/configs/SLA_INSTITUTE_VERIFICATION_DAYS",
        json=update_payload,
        headers=auth_tokens["admin_headers"]
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["config_value"] == "12"

def test_audit_trail_explorer_with_sha256(auth_tokens):
    """F-124: Audit Trail Log Explorer with Immutable SHA-256 Checksums."""
    res = client.get("/api/v1/admin/audit-trail?limit=10", headers=auth_tokens["admin_headers"])
    assert res.status_code == 200
    data = res.json()
    assert "total_records" in data
    assert "chain_verified" in data
    assert data["chain_verified"] is True
    assert "records" in data

    if len(data["records"]) > 0:
        first = data["records"][0]
        assert "sha256_hash" in first
        assert len(first["sha256_hash"]) == 64

def test_officer_impersonation_shadow_mode(auth_tokens):
    """F-125: Super-Admin Officer Impersonation / Shadow Mode."""
    payload = {
        "target_user_id": auth_tokens["officer_1"].id,
        "justification": "Troubleshoot district approval batch bottleneck",
        "read_only": True
    }
    res = client.post("/api/v1/admin/impersonate/start", json=payload, headers=auth_tokens["super_admin_headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["target_user_id"] == auth_tokens["officer_1"].id
    assert data["read_only"] is True
    assert "session_token" in data
    assert data["is_active"] is True

def test_multi_tenant_state_config(auth_tokens):
    """F-126: Multi-Tenant Architecture & State White-Labeling."""
    res = client.get("/api/v1/admin/tenant-config?state_code=JH")
    assert res.status_code == 200
    data = res.json()
    assert data["state_code"] == "JH"
    assert "Jharkhand" in data["state_name"]
    assert "helpline_phone" in data

    # Update tenant config
    update_payload = {
        "portal_title": "e-Kalyan ST Seva Portal - Government of Jharkhand (Verified)",
        "helpline_phone": "1800-345-7788"
    }
    res = client.put("/api/v1/admin/tenant-config?state_code=JH", json=update_payload, headers=auth_tokens["admin_headers"])
    assert res.status_code == 200
    updated = res.json()
    assert updated["portal_title"] == "e-Kalyan ST Seva Portal - Government of Jharkhand (Verified)"
    assert updated["helpline_phone"] == "1800-345-7788"

def test_system_health_telemetry(auth_tokens):
    """F-127: System Health, Server Metrics & Uptime Monitoring Dashboard."""
    res = client.get("/api/v1/admin/system-health", headers=auth_tokens["admin_headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["portal_status"] == "OPERATIONAL"
    assert data["uptime_percentage"] > 99.0
    assert "cache_hit_ratio_pct" in data
    assert "api_p95_latency_ms" in data
    assert "services" in data
    assert len(data["services"]) >= 4

    service_names = [s["service_name"] for s in data["services"]]
    assert any("DigiLocker" in name for name in service_names)
    assert any("NPCI" in name for name in service_names)
    assert any("PFMS" in name for name in service_names)

def test_retention_purge_dpdp_compliance(auth_tokens):
    """F-128: Data Purging, GDPR/DPDP Act 2023 Compliance & Retention Policy Enforcement."""
    payload = {
        "entity_type": "APPLICATION",
        "dry_run": True
    }
    res = client.post("/api/v1/admin/retention/run-purge", json=payload, headers=auth_tokens["super_admin_headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["entity_type"] == "APPLICATION"
    assert data["retention_period_years"] == 7
    assert data["dry_run"] is True
    assert "certificate_id" in data
    assert data["certificate_id"].startswith("DPDP-CERT-")

def test_role_enforcement_rbac_guards(auth_tokens):
    """Verify security guards: Student cannot access administrative settings."""
    res = client.get("/api/v1/admin/configs", headers=auth_tokens["student_headers"])
    assert res.status_code == 403

    res = client.post(
        "/api/v1/admin/retention/run-purge",
        json={"entity_type": "APPLICATION", "dry_run": True},
        headers=auth_tokens["student_headers"]
    )
    assert res.status_code == 403
