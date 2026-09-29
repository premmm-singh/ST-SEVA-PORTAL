# Phase 12: External Gateway Integrations & API Interoperability (Features 129–138) Implementation Plan

## 1. Overview & Objectives
Phase 12 establishes production-grade gateway bridges and interoperability infrastructure connecting the ST Seva Portal with National and State statutory systems:
- **NeGD DigiLocker** (Ministry of Electronics & IT)
- **UIDAI Aadhaar Vault & Tokenization Engine**
- **NPCI Aadhaar Payment Bridge (APB)**
- **Public Financial Management System (PFMS Core)**
- **AISHE Master College Directory** (Department of Higher Education)
- **Academic Examination Boards (CBSE, CISCE, JAC)**
- **State e-District / JharSewa Caste & Income Certificate Service**
- **UMANG Mobile App API Gateway**
- **Outbound Webhook Subscription Hub** (HMAC-SHA256 signed)
- **Token Bucket API Rate Limiter & DDoS Shield**

---

## 2. Master Feature Breakdown

| Feature # | Feature Name | Core Functionality & Technical Requirements |
|:---|:---|:---|
| **F-129** | **DigiLocker NeGD Production Gateway** | Direct OAuth 2.0 PKCE authorization code exchange, doc pull API (`/pull/uri`), XML/JSON metadata parser, and digital signature certificate verification (`.p7b` / PKCS#7). |
| **F-130** | **UIDAI Aadhaar Vault & Tokenization Engine** | Hardware Security Module (HSM) / AES-256-GCM encrypted token storage. Replaces raw 12-digit Aadhaar numbers with 36-character non-reversible reference tokens across all application tables. |
| **F-131** | **NPCI Aadhaar Payment Bridge (APB) Ingestion** | Automated reconciliation pipeline ingesting daily NPCI mapper files (`.csv` / `.txt`), parsing IIN bank routing codes, and updating beneficiary account seeding flags. |
| **F-132** | **PFMS Core XML Exchange & Digital Signature (DSC)** | XML payload generator compliant with PFMS 2.0 schema, PKCS#7 X.509 token signing simulation, and dispatch log recording. |
| **F-133** | **AISHE Directory Sync & College Verification API** | Automated AISHE code lookup, institution accreditation grade verification, and affiliation status caching. |
| **F-134** | **Academic Board (CBSE/CISCE/JAC) e-Marksheet Webhooks** | Automated mark verification for 10th and 12th board results via roll code / roll number verification endpoints. |
| **F-135** | **JharSewa / e-District Certificate API** | Real-time verification of Jharkhand digital caste and income certificates against SDO/CO registry with bar code verification. |
| **F-136** | **UMANG Mobile App REST Gateway & SSO** | Specialized lightweight REST endpoints formatted for UMANG SDK payload structure with JWT SSO token exchange. |
| **F-137** | **Outbound Webhook Hub & HMAC-SHA256 Dispatcher** | Event subscription system notifying colleges and external monitoring services of application status changes with cryptographic signature headers. |
| **F-138** | **Token Bucket API Rate Limiter & DDoS Protection Shield** | Distributed sliding-window token bucket limiter preventing brute-force attacks and DDoS traffic across public inquiry endpoints. |

---

## 3. Implementation Steps

### Step 1: Backend Database Models
- Add models in `app/db/models/gateways.py`:
  - `AadhaarVaultToken` (user_id, tokenized_reference, salt, masked_aadhaar, created_at)
  - `NpciMapperRecord` (aadhaar_token_id, bank_iin, bank_name, status, last_seeded_date)
  - `PfmsExchangeMessage` (batch_id, message_id, xml_payload, dsc_signature, status, ack_payload)
  - `WebhookSubscription` (subscriber_name, target_url, secret_key, event_types, is_active)
  - `WebhookDispatchLog` (subscription_id, event_type, payload, status_code, signature, dispatched_at)
  - `ExternalApiRateLimit` (ip_address, endpoint_pattern, tokens_remaining, last_refill)
- Register models in `app/db/models/__init__.py` and run `python -m app.db.init_db`.

### Step 2: Gateway Services Layer
- Create `app/services/gateway_service.py`:
  - `AadhaarVaultService`: AES-256-GCM tokenization & retrieval.
  - `DigiLockerGatewayService`: NeGD document pull and certificate extraction.
  - `NpciApbService`: Daily mapper sync & bank account status check.
  - `PfmsExchangeService`: XML generation and digital signature signing.
  - `AcademicBoardService`: JAC/CBSE mark verification.
  - `JharSewaService`: Digital caste/income certificate verification.
  - `WebhookService`: HMAC-SHA256 signed event dispatching.
  - `RateLimiterService`: In-memory / Redis sliding token bucket.

### Step 3: API Endpoints
- Create `app/api/v1/endpoints/gateways.py`:
  - `POST /api/v1/gateways/digilocker/pull-document`
  - `POST /api/v1/gateways/aadhaar/tokenize`
  - `POST /api/v1/gateways/npci/sync-mapper`
  - `POST /api/v1/gateways/pfms/dispatch-batch`
  - `GET /api/v1/gateways/aishe/verify/{aishe_code}`
  - `POST /api/v1/gateways/academic/verify-marks`
  - `POST /api/v1/gateways/jharsewa/verify-certificate`
  - `POST /api/v1/gateways/umang/sso-exchange`
  - `POST /api/v1/gateways/webhooks/subscribe`
  - `GET /api/v1/gateways/webhooks/logs`
- Include router in `app/api/v1/api.py`.

### Step 4: Backend Automated Tests
- Create `backend/tests/test_phase12.py` with 10 comprehensive gateway and rate-limiting tests.
- Execute full test suite across all 12 phases (`pytest tests/`).

### Step 5: Frontend Service & Gateway Integrations Workbench
- Create `frontend/src/services/gatewayService.js`.
- Create `frontend/src/pages/gateways/GatewayWorkbenchPage.jsx` with tabs for each integration.
- Register route `/officer/gateways` in `App.jsx` and add nav link in `GovHeader.jsx`.
- Verify with `npm run build`.
