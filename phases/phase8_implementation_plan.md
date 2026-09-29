# Phase 8 Implementation Plan: Communication & Notification Hub (Features 84–95)

**Project**: ST Seva Portal (AI-Powered ST Scholarship Verification & Allocation System)  
**Phase**: Phase 8 — Communication & Notification Hub  
**Dependencies**: Phases 1–7 (Users, Applications, Scrutiny Defect Notices, Sanctions, DBT Disbursed Events)

---

## 1. Executive Summary & Statutory Context
Phase 8 establishes a robust multi-channel notification engine keeping tribal students, academic institutions, and welfare officers informed in real time across the application, scrutiny, merit, and payment lifecycles. It complies with **Telecom Regulatory Authority of India (TRAI) Distributed Ledger Technology (DLT)** mandates and **Ministry of Electronics and Information Technology (MeitY)** accessibility guidelines.

---

## 2. Feature Breakdown (Features 84–95)

### F-84: CDAC / NIC SMS Gateway with DLT Template Enforcement
- Connects to government SMS gateways (CDAC / NIC SMS seva).
- Enforces pre-registered DLT Header IDs (e.g., `JHGOVT-STSEVA`) and Content Template IDs for statutory compliance.

### F-85: WhatsApp Business API Interactive Gateway
- Sends rich media notifications with actionable quick-reply buttons (e.g., "Download Sanction Order", "Fix Defect Notice").

### F-86: Multi-Lingual Email & Letter Generator
- Dispatches transactional emails formatted in HTML and plain text with localized language templates: **English**, **Hindi**, and regional languages/scripts (**Santali / Ol Chiki**, **Ho**, **Mundari**).

### F-87: Real-Time In-App Notification Center
- Persistent in-app notifications with unread counts, urgency levels (`CRITICAL`, `WARNING`, `INFO`), deep links to relevant screens, and instant mark-as-read.

### F-88: Automated Lifecycle Milestone Event Engine
- Emits notifications automatically upon core portal transitions:
  - Application Submitted & Acknowledged
  - Institutional Verification & Attendance Flags
  - Scrutiny Defect Notice Raised (7-day clock started)
  - Allocation Merit List & Provisional Objection Window Opened
  - Sanction Order Digitally Sealed
  - DBT Bank Account Credited with RBI UTR Number

### F-89: DWO & Admin Bulk Broadcast Tool
- Allows District Welfare Officers to send targeted broadcast messages to specific cohorts (e.g., all PVTG students in Ranchi with pending renewals, or all applicants with unseeded Aadhaar accounts).

### F-90: Multi-Channel Fallback Hierarchy
- Smart retry progression: If primary high-priority channel delivery fails (e.g. WhatsApp unreachable), system cascades to SMS, In-App, and Email.

### F-91: Student Notification Preferences & DND Management
- Granular settings allowing students to select preferred communication channels, language, and quiet hours while ensuring statutory alerts (sanctions, defects) cannot be muted.

### F-92: Delivery Receipt (DLR) Webhook Ingestion & Analytics
- Ingests delivery receipts from telecom and messaging gateways tracking `QUEUED`, `SENT`, `DELIVERED`, `READ`, or `FAILED` with failure codes (e.g., DND active, invalid number).

### F-93: Critical Deadline Escalation & Auto-Chaser
- Automated countdown chaser triggered 48 hours and 24 hours prior to defect resolution deadlines or objection window expirations.

### F-94: Interactive Actionable Notification Cards
- Notification items feature direct embedded actions (e.g., "Upload Income Certificate", "File Merit Objection", "View Payment Status").

### F-95: Statutory Communication Audit Trail & TRAI Log Exporter
- Immutable audit log recording message hash, recipient identifier, DLT template ID, timestamp, channel, and delivery status for regulatory compliance.

---

## 3. Database Schema Design (`backend/app/db/models/notification.py`)

1. **`Notification`**:
   - `id`, `user_id` (recipient), `application_id`, `category` (`APPLICATION`, `SCRUTINY`, `ALLOCATION`, `DBT`, `BROADCAST`, `SYSTEM`), `priority` (`URGENT`, `HIGH`, `NORMAL`, `LOW`), `title`, `message`, `action_url`, `is_read`, `read_at`, `created_at`.
2. **`NotificationDispatchLog`**:
   - `id`, `notification_id`, `recipient_address` (mobile / email), `channel` (`SMS`, `WHATSAPP`, `EMAIL`, `IN_APP`), `dlt_template_id`, `gateway_ref_id`, `delivery_status` (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`), `dlr_code`, `attempts`, `sent_at`, `delivered_at`.
3. **`NotificationPreference`**:
   - `id`, `user_id`, `sms_enabled`, `whatsapp_enabled`, `email_enabled`, `in_app_enabled`, `preferred_language` (`EN`, `HI`, `SANTALI`, `HO`, `MUNDARI`), `updated_at`.
4. **`BroadcastCampaign`**:
   - `id`, `title`, `message_text`, `target_role`, `target_district`, `target_scheme_id`, `total_recipients`, `success_count`, `failed_count`, `initiated_by_officer_id`, `created_at`.

---

## 4. Proposed API Endpoints (`/api/v1/notifications`)

- `GET /api/v1/notifications/my-notifications`: Fetch in-app notifications with unread count.
- `POST /api/v1/notifications/{id}/mark-read`: Mark single notification as read.
- `POST /api/v1/notifications/mark-all-read`: Mark all notifications as read.
- `GET /api/v1/notifications/preferences`: Get student channel preferences.
- `PUT /api/v1/notifications/preferences`: Update communication preferences.
- `POST /api/v1/notifications/broadcast`: Officer broadcast engine for targeted cohorts.
- `GET /api/v1/notifications/broadcasts`: List past broadcast campaigns.
- `POST /api/v1/notifications/webhooks/dlr`: Ingest delivery receipts (DLR).
- `GET /api/v1/notifications/audit/trai-compliance`: Export statutory communication delivery audit trail.

---

## 5. Frontend Interfaces

1. **In-App Notification Center Drawer & Page** (`/notifications`):
   - Real-time notification feed, category filters, priority tags, mark-all-read, and quick-action links.
2. **GovHeader Interactive Bell Dropdown**:
   - Live badge counter with unread notifications preview.
3. **Student Communication Preferences Page** (`/settings/notifications`):
   - Multi-channel toggles (SMS, WhatsApp, Email) and preferred language selector.
4. **Officer Bulk Broadcast Workbench** (`/officer/broadcasts`):
   - Audience filtering (by District, Scheme, Quota, or Defect status), DLT template selection, and delivery analytics.

---

## 6. Verification Plan & Test Suite

- Create `backend/tests/test_phase8.py` covering:
  - In-app notification creation, unread counting, and mark-as-read.
  - Multi-channel dispatch (SMS with DLT Template, WhatsApp interactive, Email localized).
  - Multi-language template rendering (English, Hindi, Santali).
  - Milestone trigger automation for application lifecycle events.
  - DWO bulk broadcast targeting specific districts.
  - Multi-channel delivery fallback execution.
  - Student preference management.
  - DLR webhook ingestion and delivery status transitions.
  - Critical deadline escalation triggering.
  - TRAI compliance audit ledger export.

---

## 7. Approval Request
Please review this implementation plan for **Phase 8: Communication & Notification Hub (Features 84–95)**. Upon your approval, we will proceed immediately with backend models, service engines, API endpoints, test suite, and frontend notification center.
