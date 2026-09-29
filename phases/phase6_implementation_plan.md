# Phase 6 Implementation Plan: Merit & Allocation Engine (Features 59–70)

## 1. Overview & Objectives
Phase 6 builds the **Merit & Allocation Engine**, providing automated, transparent, and quota-compliant award determination for Scheduled Tribe scholarships and fellowships. The engine automates multi-criteria merit ranking, district and category reservation quotas, dynamic tie-breaking, budget ceiling enforcement, dry-run simulation, and digitally signed sanction order generation.

---

## 2. Features in Scope (Features 59–70)

| Feature ID | Feature Name | Key Requirements & Specifications |
|---|---|---|
| **F-59** | Merit List Generation | Multi-criteria scoring: Normalized academic marks (weight 60%) + Income inverse score (weight 25%) + Particularly Vulnerable Tribal Group (PVTG) priority bonus points (+15%). |
| **F-60** | Quota Management Engine | Horizontal and vertical quota allocation: District-wise allocation, 33% female reservation, 5% PVTG reservation, 5% benchmark disability (PwD), 2% sports/arts quota. |
| **F-61** | Deterministic Tie-Breaking Algorithm | Statutory tie-breaker: (1) Higher marks in core subjects > (2) Lower annual family income > (3) Older applicant by date of birth > (4) Earlier application submission timestamp. |
| **F-62** | Waitlist Management & Auto-Promotion | Dynamic waitlist ordering; automatic seat reallocation and promotion upon candidate dropout, forfeiture, or rejection. |
| **F-63** | Scheme Switching / Multi-Offer Adjudication | When a candidate qualifies for multiple schemes (e.g., Post-Matric and National Overseas/Fellowship), allow candidate or admin selection of the higher-value scheme while releasing the alternative seat. |
| **F-64** | Multi-Year Fellowship Tracking | Multi-year fellowship cohort management: Annual progress report submission and guide/HOD verification for continuation of Ph.D./M.Phil fellowships. |
| **F-65** | Academic Renewal Threshold Validator | Strict academic criteria for continuation: Minimum 50% marks in semester/annual exams for general ST, relaxed to 45% for PVTG students. |
| **F-66** | Allocation Dry-Run Simulator | Sandboxed simulator allowing welfare directors to preview allocation outcomes, quota fill rates, and budget consumption before publishing. |
| **F-67** | Objection & Correction Window | Configurable 7-day public grievance window where candidates can submit merit ranking disputes with documentary proof prior to final freeze. |
| **F-68** | Final Sanction Order Generator | PDF generation of statutory sanction orders with unique Sanction Order Number (e.g., `ST/SANCTION/2026-27/JH/00492`), recipient roster, breakdown of maintenance & tuition allowances, and SHA-256 digital signature. |
| **F-69** | Budgetary Cap & Fund Exhaustion Check | Real-time validation preventing seat allocation from exceeding central and state scheme budget allocations. |
| **F-70** | Immutable Allocation Audit Trail | Tamper-proof event log tracking every allocation calculation, override, waitlist elevation, and final order generation. |

---

## 3. Data Models (`backend/app/db/models/allocation.py`)

1. **`AllocationCycle`**:
   - `id`, `scheme_id`, `academic_year`, `financial_year`, `total_budget`, `allocated_budget`, `total_seats`, `status` (`DRAFT`, `SIMULATED`, `OBJECTION_WINDOW`, `FINALIZED`), `objection_deadline`, `created_by`, `created_at`.
2. **`MeritScore`**:
   - `id`, `application_id`, `allocation_cycle_id`, `academic_score`, `income_score`, `pvtg_bonus`, `total_merit_score`, `rank_overall`, `rank_district`, `rank_category`.
3. **`AllocationResult`**:
   - `id`, `allocation_cycle_id`, `application_id`, `student_id`, `status` (`SELECTED`, `WAITLISTED`, `INELIGIBLE_EXCEEDED_BUDGET`), `quota_category` (`GENERAL_ST`, `FEMALE_33`, `PVTG_5`, `PWD_5`, `SPORTS_2`), `allocated_amount`, `waitlist_number`, `sanction_order_number`.
4. **`MeritObjection`**:
   - `id`, `allocation_cycle_id`, `student_id`, `application_id`, `objection_type`, `description`, `supporting_doc_id`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`), `resolution_remarks`, `resolved_by`, `created_at`.
5. **`SanctionOrder`**:
   - `id`, `order_number`, `allocation_cycle_id`, `scheme_id`, `total_beneficiaries`, `total_sanctioned_amount`, `digital_signature_hash`, `issued_by`, `issued_at`, `pdf_path`.
6. **`AllocationAuditLog`**:
   - `id`, `allocation_cycle_id`, `event_type`, `details_json`, `performed_by`, `timestamp`.

---

## 4. Backend Services & Algorithms (`backend/app/services/allocation_service.py`)

- **`calculate_merit_score(application, scheme)`**:
  - Academic score calculation from past exam percentage.
  - Inverse income score: higher score for lower income below ₹2.5 Lakhs.
  - PVTG priority points: +15 points for candidates belonging to PVTG communities (e.g., Asur, Birhor, Birjia, Korwa, Mal Paharia, Sauria Paharia).
- **`run_quota_allocation(allocation_cycle_id, dry_run=True)`**:
  - Vertical and horizontal quota reservation partitioning.
  - Tie-breaking engine execution.
  - Budgetary cap checking: aggregate allocated amount $\le$ scheme allocation.
- **`process_waitlist_promotion(allocation_cycle_id)`**:
  - Auto-elevates highest-ranked waitlisted candidate when a selected student drops out or switches schemes.
- **`generate_sanction_order_pdf(allocation_cycle_id, officer_id)`**:
  - Generates official sanction memo PDF with digital SHA-256 seal.

---

## 5. API Endpoints (`/api/v1/allocation`)

- `POST /api/v1/allocation/cycles`: Create allocation cycle for scheme & academic year.
- `GET /api/v1/allocation/cycles`: List allocation cycles with budget and status metrics.
- `POST /api/v1/allocation/cycles/{id}/simulate`: Run allocation dry-run simulator (F-66).
- `GET /api/v1/allocation/cycles/{id}/results`: Get merit list and allocation results with quota breakdown.
- `POST /api/v1/allocation/cycles/{id}/open-objection-window`: Open 7-day objection window (F-67).
- `POST /api/v1/allocation/cycles/{id}/objections`: Submit student merit objection.
- `POST /api/v1/allocation/cycles/{id}/finalize`: Finalize allocation and freeze merit list.
- `POST /api/v1/allocation/cycles/{id}/generate-sanction-order`: Generate signed sanction order PDF (F-68).
- `GET /api/v1/allocation/cycles/{id}/audit-trail`: View immutable allocation audit logs (F-70).

---

## 6. Frontend Components & Pages

- **Allocation Simulator & Dashboard (`/officer/allocations`)**:
  - Scheme selector, budget utilization progress bar, seat matrix viewer.
  - "Run Simulator" interactive tool showing quota fulfillment cards (Female, PVTG, PwD, General ST).
- **Merit List & Quota Roster Viewer (`/officer/allocations/:id/merit-list`)**:
  - Searchable, filterable merit table with score breakdown, tie-breaking criteria badges, and allocation status.
  - Waitlist management tab with auto-promote trigger.
- **Student Merit & Objection Portal (`/student/merit-status`)**:
  - Student view of merit rank, quota category, allocation status, and "File Merit Objection" modal.
- **Sanction Order Generator Modal**:
  - Digital seal creation, PDF preview, and statutory release button.

---

## 7. Verification & Automated Testing Plan

A suite of 10+ automated pytest test cases will be developed (`backend/tests/test_phase6.py`):
1. Multi-criteria merit calculation with PVTG priority points.
2. Tie-breaking resolution across applicants with identical percentages.
3. Quota enforcement: 33% female, 5% PVTG, 5% PwD.
4. Budgetary cap overflow prevention.
5. Dry-run simulation vs. finalized allocation.
6. Waitlist automatic elevation upon candidate drop.
7. Scheme switching conflict resolution.
8. Renewal eligibility check (≥50% ST, ≥45% PVTG).
9. Student merit objection submission and officer resolution.
10. Sanction order generation with digital SHA-256 seal.
