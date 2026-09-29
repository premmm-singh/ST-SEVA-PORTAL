# Phase 9 Implementation Plan: Grievance Redressal & Helpdesk System (Features 96–107)

## 1. Overview
The **Grievance Redressal & Helpdesk System** provides a transparent, accountable, and time-bound mechanism for ST scholarship beneficiaries, parents, and educational institutions to file grievances, seek clarifications, and demand statutory redressal under the Right to Public Services Act.

---

## 2. Features Breakdown (Features 96–107)

| Feature ID | Feature Name | Description & Technical Scope |
|:---|:---|:---|
| **F-96** | **Beneficiary Grievance Registration** | Multi-category grievance intake (Application Stalled, Document Rejection Dispute, DBT Payment Failure, Institution Verification Delay) with document upload. |
| **F-97** | **Statutory Ticket & Tracking Code** | Cryptographic tracking ID generator (`GRV-JH-2026-XXXXX`) with QR verification. |
| **F-98** | **Multi-Tier Escalation Matrix** | 3-tiered hierarchy: L1 Helpdesk Officer -> L2 District Welfare Officer (DWO) -> L3 State Welfare Directorate. |
| **F-99** | **Statutory SLA Timer & Auto-Escalation** | Enforces 7-day statutory resolution SLA. Automatic auto-escalation to next tier upon SLA breach with officer accountability flagging. |
| **F-100** | **Hearing Appointment Scheduler** | Officer hearing scheduler for complex disputes with virtual/physical meeting notices and attendance logs. |
| **F-101** | **Public Grievance Tracker** | Citizen portal for tracking real-time resolution progress, current handling officer, and SLA countdown clock. |
| **F-102** | **Action Taken Report (ATR) & Closure** | Mandatory Action Taken Report (ATR) documentation with officer digital signature seal before closure. |
| **F-103** | **Appeal & Reopen Mechanism** | 15-day window for complainant to reject resolution and escalate to higher appellate authority. |
| **F-104** | **AI-Powered Smart FAQ & Knowledgebase** | Instant self-service resolution for common queries (eligibility rules, income criteria, PFMS delays). |
| **F-105** | **WhatsApp Grievance Intake Bot** | Simulated WhatsApp conversation flow for submitting grievances and checking status via mobile. |
| **F-106** | **CPGRAMS & State Jansamvad Sync** | National CPGRAMS / Jharkhand CM Jansamvad API adapter for importing and exporting external complaints. |
| **F-107** | **Grievance Analytics & Heatmap** | Executive dashboard analyzing average resolution time, pending bottlenecks, and district-wise dispute heatmaps. |

---

## 3. Database Architecture (`backend/app/db/models/grievance.py`)

### A. `Grievance`
- `id`: UUID (Primary Key)
- `ticket_number`: Unique statutory string (e.g. `GRV-JH-2026-A1B2C3`)
- `complainant_user_id`: Foreign Key (`users.id`)
- `application_id`: Nullable Foreign Key (`applications.id`)
- `category`: Enum (`APPLICATION_DELAY`, `SCRUTINY_REJECTION`, `DISBURSEMENT_FAILURE`, `INSTITUTION_HARASSMENT`, `TECHNICAL_GLITCH`, `OTHER`)
- `subject`: String(200)
- `description`: Text
- `evidence_document_url`: Nullable Text
- `status`: Enum (`SUBMITTED`, `IN_REVIEW`, `HEARING_SCHEDULED`, `ESCALATED_L2`, `ESCALATED_L3`, `RESOLVED`, `CLOSED`, `APPEALED`)
- `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- `tier_level`: Integer (1 = L1 Assistant, 2 = L2 DWO, 3 = L3 Directorate)
- `assigned_officer_id`: Nullable Foreign Key (`users.id`)
- `sla_deadline`: DateTime (7 days from creation / tier escalation)
- `is_sla_breached`: Boolean
- `resolution_summary`: Nullable Text
- `action_taken_report`: Nullable Text
- `closed_at`: Nullable DateTime
- `created_at`, `updated_at`: DateTime

### B. `GrievanceTimeline`
- `id`: UUID
- `grievance_id`: Foreign Key (`grievances.id`)
- `action`: String (e.g. `FILED`, `ASSIGNED`, `SLA_BREACH_ESCALATED`, `HEARING_CALLED`, `RESOLVED`, `APPEAL_OPENED`)
- `remarks`: Text
- `actor_id`: Foreign Key (`users.id`)
- `actor_role`: String
- `created_at`: DateTime

### C. `GrievanceHearing`
- `id`: UUID
- `grievance_id`: Foreign Key (`grievances.id`)
- `scheduled_at`: DateTime
- `mode`: Enum (`VIRTUAL_MEETING`, `PHYSICAL_OFFICE`)
- `venue_or_link`: String
- `hearing_notes`: Nullable Text
- `attended_by_complainant`: Nullable Boolean

### D. `HelpdeskArticle`
- `id`: UUID
- `category`: String
- `question`: String(255)
- `answer`: Text
- `tags`: String (comma-separated keywords)
- `view_count`: Integer
- `is_published`: Boolean

---

## 4. Backend Services & Endpoints

### Service Layer (`backend/app/services/grievance_service.py`):
1. `file_grievance`: Generates unique ticket number, sets statutory 7-day SLA, triggers notification to applicant and officer.
2. `check_and_escalate_sla_breaches`: Automatic cron/job checking tickets exceeding `sla_deadline`, promotes to next tier, logs in timeline.
3. `record_officer_action_taken`: Formulates official ATR with digital signature hash and resolves grievance.
4. `schedule_dispute_hearing`: Issues hearing appointment notice via SMS/In-App.
5. `file_grievance_appeal`: Allows dissatisfied student to reopen ticket and escalate directly to State Directorate.
6. `sync_external_cpgrams`: Interoperability engine for national portal tickets.
7. `get_analytics_summary`: District-wise breakdown, SLA compliance percentages, and common dispute categories.

### REST Endpoints (`backend/app/api/v1/endpoints/grievance.py`):
- `POST /grievances`: Beneficiary files grievance.
- `GET /grievances/my-grievances`: Complainant lists own tickets.
- `GET /grievances/track/{ticket_number}`: Public tracking endpoint without requiring login.
- `GET /grievances/officer/queue`: Welfare Officer grievance review desk.
- `POST /grievances/{id}/action`: Officer updates status, assigns, or resolves ticket with ATR.
- `POST /grievances/{id}/schedule-hearing`: Schedule formal dispute hearing.
- `POST /grievances/{id}/appeal`: Beneficiary appeals closed grievance.
- `POST /grievances/sla/run-escalations`: Trigger automated SLA escalation engine.
- `GET /grievances/helpdesk/faq`: List smart knowledgebase articles.
- `GET /grievances/analytics/dashboard`: Executive grievance analytics and district scorecard.

---

## 5. Frontend UI/UX Design (UMANG / GIGW Standard)
1. `frontend/src/services/grievanceService.js`: Full API integration client.
2. `frontend/src/pages/grievance/FileGrievancePage.jsx`:
   - Interactive wizard: Category picker, linked application auto-suggest, description, file uploader for proof documents.
3. `frontend/src/pages/grievance/GrievanceTrackerPage.jsx`:
   - Public & logged-in tracker: Ticket number input, vertical progress timeline, handling officer contact, SLA countdown timer.
4. `frontend/src/pages/grievance/OfficerGrievanceDeskPage.jsx`:
   - Officer workbench with SLA breach alerts, priority filtering, ATR resolution modal with digital seal, and hearing scheduler.
5. `frontend/src/pages/grievance/HelpdeskFaqPage.jsx`:
   - Searchable, categorized self-help knowledgebase with smart accordion answers.

---

## 6. Verification & Automated Testing Plan
- Create `backend/tests/test_phase9.py` covering:
  1. Grievance filing and ticket format validation (`GRV-JH-2026-XXXXX`).
  2. Public tracking without authentication.
  3. Officer review and ATR submission with digital signature.
  4. SLA countdown and automated multi-tier escalation logic.
  5. Hearing scheduling workflow.
  6. Complainant appeal within statutory window.
  7. Helpdesk knowledgebase query and view counter.
  8. Executive analytics metrics calculation.
- Run full regression suite (`tests/`) ensuring all 80+ tests pass with zero regressions.
- Verify frontend production bundle compiles with 0 errors via `npm run build`.
