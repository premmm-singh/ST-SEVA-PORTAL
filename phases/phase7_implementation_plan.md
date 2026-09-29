# Phase 7 Implementation Plan: Direct Benefit Transfer (DBT) & Payment Gateway (Features 71–83)

**Project**: ST Seva Portal (AI-Powered ST Scholarship Verification & Allocation System)  
**Phase**: Phase 7 — Direct Benefit Transfer (DBT) & Payment Gateway  
**Dependencies**: Phase 6 Sanction Orders & Beneficiary Allocations  

---

## 1. Executive Summary & Statutory Context
Phase 7 bridges sanctioned scholarship allocations (Phase 6) into actual financial disbursement through India's direct benefit transfer infrastructure. It adheres to **Public Financial Management System (PFMS)** protocols, **National Payments Corporation of India (NPCI) Aadhaar Payment Bridge System (APBS)** guidelines, and **Ministry of Tribal Affairs (MoTA)** financial rules.

---

## 2. Feature Breakdown (Features 71–83)

### F-71: PFMS (Public Financial Management System) Adapter
- Generates standard XML/JSON payment payloads compliant with PFMS E-Payment specifications.
- Handles automated batch dispatch, handshake acknowledgments, and status polling (`PENDING`, `ACKNOWLEDGED`, `PROCESSED`, `REJECTED`).

### F-72: NPCI Aadhaar Payment Bridge System (APBS) Seeding Validator
- Pre-disbursement validation verifying that the student's Aadhaar number is actively seeded and mapped with NPCI DBT mapper at their bank.
- Flags non-seeded accounts with clear resolution instructions (Aadhaar seeding drive alerts).

### F-73: Penny Drop Account Verification Engine
- Real-time bank account verification executing a ₹1.00 credit test ("penny drop").
- Validates that the account holder's name matches the student's Aadhaar name using Jaro-Winkler string similarity (threshold >= 0.85).

### F-74: Split Payment Mechanism (Tuition vs. Maintenance)
- Decouples total scholarship into:
  - **Component A**: Direct electronic transfer to verified College/University account for tuition fees.
  - **Component B**: Direct DBT transfer to the student's Aadhaar-seeded personal bank account for maintenance allowance.

### F-75: Staggered Disbursement Scheduler
- Supports multi-tranche disbursements based on academic progression (e.g., 60% upon enrollment + 40% upon satisfactory mid-term attendance/grade verification).

### F-76: Payment Batch Generator & E-Kuber Treasury Exporter
- Bundles sanctioned payments into RBI E-Kuber / State Treasury formatted batch files with checksums and batch reference numbers.

### F-77: Virtual Treasury Ledger & Head-of-Account Reconciliation
- Maintains an immutable double-entry ledger tracking budget allocations across state treasury major/minor heads (e.g., `2225-02-277-ST Education`).

### F-78: Failed Transaction Auto-Retry & Smart Fallback
- Detects failure codes (e.g., dormant account, invalid IFSC, Aadhaar delinked) and triggers automated resolution workflows (re-prompting student for alternative seeded account, scheduled retries).

### F-79: Reverse Transaction & Recovery Workflow
- Manages refunds and recoveries for duplicate sanctions, false declarations, or mid-year course dropouts with audit tracking.

### F-80: Real-Time DBT Tracking Timeline & Notification Dispatch
- Student-facing tracker mirroring UMANG DBT status (`Sanctioned` -> `PFMS Batch Queued` -> `Treasury Approved` -> `Bank Credit Confirmed` with UTR number).
- Triggers SMS/Email notifications upon milestone transitions.

### F-81: Payment Gateway / Bharat QR Integration
- Enables students/institutes to process refund payments, application processing fee adjustments, or institution fee settlement via UPI / Bharat QR / Net Banking gateway mock adapter.

### F-82: District Welfare Office (DWO) Treasury Bill Generator
- Produces printable statutory Treasury Bills (Form TR-27) with DWO digital sign-off and sanction schedule attachments.

### F-83: Comptroller and Auditor General (CAG) Compliance Audit Exporter
- One-click cryptographic export of the disbursement ledger, bank UTRs, biometric consent receipts, and sanction trails formatted for state CAG audits.

---

## 3. Database Schema Design (`backend/app/db/models/dbt.py`)

1. **`PaymentBatch`**:
   - `id`, `batch_number` (`DBT/BATCH/{FY}/{SEQ}`), `scheme_id`, `cycle_id`, `total_records`, `total_amount`, `status` (`DRAFT`, `DISPATCHED`, `ACKNOWLEDGED`, `PROCESSED`, `FAILED`), `created_by`, `dispatched_at`, `processed_at`, `pfms_reference_id`.
2. **`DisbursementTransaction`**:
   - `id`, `batch_id`, `sanction_order_id`, `application_id`, `student_id`, `component_type` (`TUITION_INSTITUTION`, `MAINTENANCE_STUDENT`), `recipient_type`, `beneficiary_name`, `account_number_masked`, `ifsc_code`, `aadhaar_last_four`, `amount`, `tranche_number`, `status` (`PENDING`, `PENNY_DROP_VERIFIED`, `SENT_TO_PFMS`, `SUCCESS`, `FAILED`, `RETURNED`), `utr_number`, `failure_reason`, `retry_count`.
3. **`PennyDropVerification`**:
   - `id`, `student_id`, `application_id`, `account_number`, `ifsc`, `verified_name`, `confidence_score`, `is_match`, `timestamp`.
4. **`TreasuryHeadLedger`**:
   - `id`, `financial_year`, `major_head`, `sub_major_head`, `minor_head`, `allocated_budget`, `expended_amount`, `balance_amount`.
5. **`TreasuryBill`**:
   - `id`, `bill_number` (`TB/{DIST}/{FY}/{SEQ}`), `district`, `batch_id`, `gross_amount`, `net_amount`, `dwo_officer_id`, `signed_at`, `bill_status`.

---

## 4. Proposed API Endpoints (`/api/v1/dbt`)

- `POST /api/v1/dbt/penny-drop/verify`: Execute live penny drop validation.
- `GET /api/v1/dbt/npci/aadhaar-seeding-status`: Query NPCI seeding mapper.
- `POST /api/v1/dbt/batches/generate`: Form payment batch from Phase 6 sanction orders with split tuition/maintenance.
- `GET /api/v1/dbt/batches`: List disbursement batches.
- `POST /api/v1/dbt/batches/{id}/dispatch-pfms`: Dispatch batch to PFMS simulator adapter.
- `POST /api/v1/dbt/batches/{id}/poll-status`: Update transaction statuses with mock UTRs.
- `POST /api/v1/dbt/transactions/{id}/retry`: Trigger retry for failed transaction with updated account.
- `GET /api/v1/dbt/student/my-dbt-timeline`: Student real-time DBT tracking with UTR and tranche details.
- `POST /api/v1/dbt/treasury-bills/generate`: DWO statutory treasury bill compilation.
- `GET /api/v1/dbt/audit/cag-export`: Export CAG compliance ledger in CSV/JSON with hash verification.

---

## 5. Frontend Interfaces

1. **Officer DBT Disbursement Workbench** (`/officer/dbt`):
   - Batch creation wizard, Penny-drop bulk verifier, PFMS dispatch trigger, and Treasury bill generation.
2. **Batch Detail & UTR Reconciliation Page** (`/officer/dbt/batches/:id`):
   - Real-time transaction statuses, UTR numbers, failed transaction re-routing, and retry manager.
3. **Student DBT Tracking Timeline** (`/student/dbt-tracking`):
   - Interactive UMANG-style vertical milestone tracker showing Penny Drop -> PFMS Ack -> Treasury Cleared -> Bank Credit with UTR and split breakdown.

---

## 6. Verification Plan & Test Suite

- Create `backend/tests/test_phase7.py` covering:
  - Penny drop string matching & confidence calculation.
  - NPCI Aadhaar seeding validation gate.
  - Split payment generation (Tuition to Institute + Maintenance to Student).
  - Staggered multi-tranche scheduling.
  - PFMS batch generation, XML serialization, and UTR reconciliation.
  - Auto-retry on recoverable failures.
  - Treasury bill generation with DWO signature.
  - Student DBT status timeline query.
  - CAG compliance report generation.

---

## 7. Approval Request
Please review this implementation plan for **Phase 7: Direct Benefit Transfer (DBT) & Payment Gateway (Features 71–83)**. Upon your approval, we will proceed immediately with backend data models, service engines, API endpoints, test suite, and frontend interfaces.
