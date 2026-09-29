# Phase 11: System Administration, Multi-Tenancy & Role-Based Access Control (Features 119–128) Implementation Plan

## 1. Overview & Objectives
Phase 11 establishes the administrative backbone and governance infrastructure for the ST Seva Portal. It provides granular administrative tools for the Ministry of Tribal Affairs (MoTA) and State Welfare Departments to configure portal policies, manage user permissions, enforce security governance, and monitor system health.

---

## 2. Master Feature Breakdown

| Feature # | Feature Name | Core Functionality & Technical Requirements |
|:---|:---|:---|
| **F-119** | **Hierarchical Role-Based Access Control (RBAC) Matrix** | Multi-tiered permission matrix: MoTA National Admin, State Secretary, DWO, INO, Scrutiny Officer, Auditor, Helpdesk Agent. Dynamic permission assignments and scope restrictions (State / District / College level). |
| **F-120** | **Institutional Onboarding & AISHE Code Verification** | College registration requests, AISHE master verification, affiliation certificate validation, and INO designation approvals. |
| **F-121** | **District & Taluk Hierarchy & Officer Transfer / Delegation** | Administrative district/block mapping, temporary charge handovers, acting officer delegations with automated validity windows and audit tracking. |
| **F-122** | **System Configuration Registry & Dynamic Parameter Tuning** | Hot-configurable parameters without code deployment: statutory SLA limits, grace periods, biometric verification bypass thresholds, tranche percentages, and grievance escalation timers. |
| **F-123** | **Automated Maintenance, Snapshot Backup & Recovery Logging** | Database snapshot scheduling, vacuuming/indexing logs, archive status, and disaster recovery drill checkpoints. |
| **F-124** | **Audit Trail Log Explorer with Immutable SHA-256 Checksums** | Complete forensics viewer across all security events, logins, status overrides, and sanction generations with hash chain integrity verification. |
| **F-125** | **Super-Admin Officer Impersonation / Shadow Mode** | Secure shadow session capability for troubleshooting with mandatory justification, OTP re-authentication, read-only restriction by default, and video/keystroke session logging. |
| **F-126** | **Multi-Tenant Architecture & State White-Labeling** | Multi-state configuration support: state emblem, portal title, localized tribal languages, helpline contacts, and state-specific ST caste schedule maps. |
| **F-127** | **System Health, Server Metrics & Uptime Monitoring Dashboard** | System resource telemetry: database connection pool status, Redis cache hit ratio, API latency percentiles (p50, p95, p99), Celery/background task queue depth, and external service (DigiLocker, NPCI, PFMS) health probes. |
| **F-128** | **Data Purging, GDPR/DPDP Act 2023 Compliance & Retention Policy** | Anonymization and archiving workflows for historical applicants after statutory graduation window (7 years), right-to-be-forgotten policy enforcement for rejected non-beneficiaries, and DPDP compliance certificates. |

---

## 3. Implementation Steps

### Step 1: Backend Database Models
- Add models in `app/db/models/admin.py`:
  - `RolePermissionMatrix` (role, permission, scope, resource)
  - `OfficerDelegation` (delegator_id, delegatee_id, district, valid_from, valid_to, reason, is_active)
  - `SystemConfigRegistry` (config_key, config_value, data_type, category, description, updated_by)
  - `ImpersonationSession` (admin_id, target_user_id, justification, session_token, started_at, ended_at, actions_performed)
  - `TenantStateConfig` (state_code, state_name, emblem_url, primary_color, helpline_number, default_language)
  - `RetentionPurgePolicy` (entity_type, retention_years, last_run_at, records_purged, status)
- Register models in `app/db/models/__init__.py` and execute `python -m app.db.init_db`.

### Step 2: Pydantic Schemas & Services
- Create `app/schemas/admin.py`: Request & response schemas for RBAC, delegation, system configs, system health, and audit logs.
- Create `app/services/admin_service.py`: Business logic for parameter management, officer delegation, impersonation auditing, and system telemetry.

### Step 3: API Endpoints & Routes
- Create `app/api/v1/endpoints/admin.py` with endpoints:
  - `GET /api/v1/admin/rbac/matrix`
  - `PUT /api/v1/admin/rbac/permissions`
  - `GET /api/v1/admin/configs`
  - `PUT /api/v1/admin/configs/{key}`
  - `POST /api/v1/admin/delegations`
  - `GET /api/v1/admin/delegations/active`
  - `GET /api/v1/admin/audit-trail`
  - `POST /api/v1/admin/impersonate/start`
  - `POST /api/v1/admin/impersonate/end`
  - `GET /api/v1/admin/system-health`
  - `GET /api/v1/admin/tenant-config`
  - `POST /api/v1/admin/retention/run-purge`
- Include router in `app/api/v1/api.py`.

### Step 4: Backend Automated Tests
- Create `backend/tests/test_phase11.py` covering all administrative features with 100% pass target.
- Run complete test suite across all 11 phases (`tests/`).

### Step 5: Frontend Service & Administration Console
- Create `frontend/src/services/adminService.js`.
- Create `frontend/src/pages/admin/AdminPortalPage.jsx` with tabs:
  - *RBAC & Access Control*
  - *Dynamic Portal Configs*
  - *Officer Delegation & Transfer*
  - *Audit Trail & Forensics*
  - *Multi-Tenant Branding*
  - *System Health Probes*
- Register routes in `App.jsx` and add navigation in `GovHeader.jsx`.
- Verify with `npm run build`.
