# ST Seva Portal - Phase 3 Implementation Plan: Document Management

**Module**: Module 3 — Document Management (Features 27–36)  
**Target Date**: September 27, 2026  
**Status**: Ready for User Review & Approval  

---

## 1. Scope & Objective

Phase 3 implements the enterprise-grade, tamper-proof **Document Management Engine** for the ST Seva Portal. This subsystem manages the lifecycle of all verification proofs submitted by tribal scholarship applicants—ranging from digital uploads, virus scanning, AES-256 encryption at rest, SHA-256 cryptographic integrity validation, in-browser watermarked preview, document versioning, expiry tracking, and direct DigiLocker API integration.

---

## 2. Feature Breakdown (Features 27–36)

| Feature # | Feature Name | Description & Specification |
|:---|:---|:---|
| **27** | **Multi-Format Upload** | Support PDF, JPG, PNG formats with client-side image compression (Canvas API) up to 10MB per file with mime-type validation. |
| **28** | **Secure File Storage** | Encrypted at rest using AES-256 in a secure storage vault directory; generation of HMAC-signed access URLs with strict 15-minute expiration. |
| **29** | **Virus & Malware Scanning** | ClamAV scanner integration with file stream inspection and quarantined/infected state handling. |
| **30** | **File Integrity Verification** | SHA-256 cryptographic hash calculated on upload and re-verified on every access to detect any bit rot or tampering. |
| **31** | **Document Categorization** | 7 mandatory categories: `CASTE_CERTIFICATE`, `INCOME_CERTIFICATE`, `MARKSHEET`, `DOMICILE_CERTIFICATE`, `BANK_PASSBOOK`, `FEE_RECEIPT`, `DISABILITY_CERTIFICATE`. |
| **32** | **Document Versioning** | Preserve complete audit trail when documents are re-uploaded; maintain version increments (`v1`, `v2`) and soft-delete support. |
| **33** | **In-Browser Document Viewer** | Built-in viewer for PDF and images supporting zoom (+/-), 90° rotation, fit-to-screen, and page navigation. |
| **34** | **Document Expiry Tracking** | Automated income certificate validity tracking (1-year validity per G.O.), alerting applicants 30 days prior to expiry. |
| **35** | **DigiLocker Document Pull** | One-click instant pull of verified ST Caste Certificate and Income Certificate from DigiLocker sandbox with issuer URI. |
| **36** | **Dynamic Watermarking** | Real-time dynamic overlay: *"ST Seva Portal • For Verification Only • [Timestamp] • [User ID]"* diagonally watermarked on all previews and downloads. |

---

## 3. Architecture & Technical Design

### A. Backend Architecture

```
backend/
├── app/
│   ├── db/models/
│   │   └── document.py               <-- Document, DocumentVersion models
│   ├── schemas/
│   │   └── document.py               <-- Pydantic schemas (upload, preview, signed URL, DigiLocker pull)
│   ├── services/
│   │   ├── storage_service.py        <-- AES-256 encryption at rest & 15-min signed URL generator
│   │   ├── clamav_scanner.py         <-- Virus/malware scanner interface
│   │   ├── watermark_service.py      <-- Dynamic diagonal watermark generator (Pillow / ReportLab)
│   │   └── digilocker_service.py     <-- DigiLocker certificate puller
│   └── api/v1/endpoints/
│       └── documents.py              <-- Upload, download, preview, verify, versioning, pull routes
└── tests/
    └── test_phase3.py                <-- 10 comprehensive unit & integration tests
```

### B. Database Schema (`backend/app/db/models/document.py`)
- `id`: UUID Primary Key
- `student_id`: ForeignKey to `users.id`
- `application_id`: Nullable ForeignKey to `applications.id`
- `document_category`: String enum (`CASTE_CERTIFICATE`, `INCOME_CERTIFICATE`, etc.)
- `original_filename`: String
- `storage_path`: Encrypted path on disk (`storage/vault/`)
- `file_size`: Integer bytes
- `mime_type`: String (`application/pdf`, `image/jpeg`, `image/png`)
- `sha256_hash`: 64-char Hex Digest
- `is_encrypted`: Boolean (default True)
- `encryption_iv`: Base64 IV string
- `scan_status`: `CLEAN`, `INFECTED`, `PENDING`
- `version`: Integer (starts at 1)
- `is_active`: Boolean (default True, for soft delete)
- `parent_document_id`: Nullable ForeignKey self-referential
- `issued_date`: Date
- `expiry_date`: Date (auto-calculated for Income Certificates)
- `is_expired`: Boolean
- `source`: `DIRECT_UPLOAD`, `DIGILOCKER_FETCH`
- `digilocker_uri`: String
- `created_at`, `updated_at`

### C. Security & Watermarking Implementation
1. **AES-256 Storage at Rest**: Uploaded file bytes are encrypted using AES-256 before writing to disk; decrypted dynamically in-memory when serving authorized requests.
2. **15-Minute Signed URLs**: Generated with HMAC-SHA256 signature containing `doc_id`, `user_id`, and `exp = now + 900s`. Tampered or expired URLs return HTTP 403 Forbidden.
3. **Dynamic Watermarking**:
   - For images (JPG/PNG): Pillow generates a semi-transparent 45-degree angled text overlay with government watermark and user timestamp.
   - For PDFs: PyPDF2/ReportLab stamps a transparent security watermark across all pages.

---

## 4. Frontend Components & Pages

1. **`src/services/documentService.js`**:
   - Upload file with progress tracking, fetch documents, generate signed URLs, stream watermarked preview, pull DigiLocker documents, replace/version document, soft-delete.
2. **`src/components/documents/DocumentUploader.jsx`**:
   - Drag-and-drop zone with client-side canvas compression for images, file type validation, size limit checks, and SHA-256 preview computation.
3. **`src/components/documents/DocumentViewerModal.jsx`**:
   - Full-featured in-browser viewer supporting zoom in/out, 90-degree rotation, full-screen, page pagination, and prominent government watermark banner.
4. **`src/pages/documents/DocumentsVaultPage.jsx` (`/documents`)**:
   - Student Document Vault showcasing all 7 categories in organized cards.
   - Displays validity alerts (e.g. *"Income Certificate valid until 2027-03-31"*).
   - "Pull from DigiLocker" button for instant verified certificate ingestion.
   - Version history drawer showing previous uploads (`v1`, `v2`).
5. **Integration with `NewApplicationWizard.jsx`**:
   - Insert document upload step where applicants attach mandatory proofs directly into their scholarship form.

---

## 5. Verification Plan

1. **Unit & Integration Tests (`backend/tests/test_phase3.py`)**:
   - Test 1: Multi-format file upload (PDF, JPG, PNG)
   - Test 2: SHA-256 hash calculation and tamper verification
   - Test 3: ClamAV scanning interface (clean vs infected mock file)
   - Test 4: AES-256 file encryption at rest
   - Test 5: 15-Minute signed URL expiration and signature validation
   - Test 6: Document versioning (v1 -> v2) and parent linking
   - Test 7: Soft deletion of documents
   - Test 8: Income certificate expiry calculation and alert
   - Test 9: Dynamic watermarking verification on preview stream
   - Test 10: DigiLocker verified document pull
2. **Regression Testing**:
   - Re-run `test_phase1.py`, `test_phase2.py`, and `verify_e2e.py` to ensure 0 regressions.
3. **Frontend Production Build**:
   - Run `npm run build` in `frontend/` to ensure zero compilation or bundling errors.

---

## 6. User Approval & Next Steps

Upon your approval of this plan, I will proceed to:
1. Implement Backend Models, Services, Schemas, and Endpoints for Document Management.
2. Build Frontend Document Vault, Uploader, and In-Browser Watermarked Viewer.
3. Execute the full test suite and deliver the `phase3_walkthrough.md` report.
