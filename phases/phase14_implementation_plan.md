# Phase 14 Implementation Plan: Security Hardening, Cryptographic Integrity & VAPT Compliance (Features 145–148)

## 1. Objectives & Overview
Phase 14 delivers defense-in-depth security hardening, cryptographic immutability, and compliance with **CERT-In (Indian Computer Emergency Response Team)** and **MeitY Cyber Security Guidelines** for the ST Seva Portal.

Features 145–148 harden the portal against adversarial penetration, enforce anti-tamper Merkle hash verification on audit trails, detect session hijacking anomalies, and provide an officer VAPT dashboard.

---

## 2. Feature Breakdown (Features 145–148)

### Feature 145: OWASP Top-10 & CERT-In Compliance Guardrails
- **Security Middleware & Headers**:
  - `Content-Security-Policy (CSP)`
  - `Strict-Transport-Security (HSTS)`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- **Input Sanitization & Injection Defense**:
  - Centralized request payload sanitizer blocking SQL injection patterns (`UNION SELECT`, `' OR '1'='1`), path traversal (`../`), and Cross-Site Scripting (`<script>`, `javascript:`).
  - CSRF double-submit cookie validation.

### Feature 146: Anti-Tamper Immutable Hash Chains & Merkle Trees for Audit Trails
- **Backend Model & Cryptographic Engine**:
  - `MerkleAuditNode` model storing `tree_index`, `leaf_hash`, `parent_hash`, `block_height`, `root_hash`, `entity_type`, `record_id`, and `created_at`.
  - Continuous SHA-256 Merkle tree synthesizer grouping audit log events into verifiable epoch blocks.
  - `POST /api/v1/security/merkle/verify`: Validates zero-tamper integrity of any audit log entry or sanction order by verifying its cryptographic inclusion proof up to the published root hash.

### Feature 147: Automated Vulnerability & Penetration Testing (VAPT) Simulation Testbed
- **VAPT Audit Engine**:
  - `POST /api/v1/security/vapt/run-scan`: Performs simulated testbed scans against 6 attack vectors:
    1. SQL Injection (SQLi)
    2. Cross-Site Scripting (XSS)
    3. Insecure Direct Object References (IDOR)
    4. Broken Object Level Authorization (BOLA)
    5. Path Traversal
    6. Session Fixation & Rate-Limit Resistance
  - Yields CERT-In compliance posture score (e.g. 98.5/100), vulnerability breakdown, and remediation receipts.

### Feature 148: Session Hijacking Defense, IP Roaming Anomaly Detection & Adaptive Step-Up Auth
- **Anomaly Detection Service**:
  - Evaluates client IP address changes, ASN transitions, and user-agent entropy during active bearer token sessions.
  - If a sudden geographic jump (>200 km in < 5 minutes) or untrusted subnet is detected, flags `SESSION_ANOMALY` and requires `MFA_STEP_UP` (TOTP or WebAuthn Biometric).
  - `POST /api/v1/security/sessions/verify-anomaly`: Analyzes session risk score and dictates step-up requirements.

---

## 3. Implementation Steps

1. **Backend Database Models (`backend/app/db/models/vapt.py`)**:
   - `MerkleAuditNode`
   - `VaptScanReport`
   - `SessionAnomalyLog`
   - Register in `backend/app/db/models/__init__.py` and create tables.
2. **Pydantic Schemas (`backend/app/schemas/vapt.py`)**:
   - `MerkleVerificationRequest`, `MerkleVerificationResponse`, `VaptScanRequest`, `VaptScanResponse`, `SessionAnomalyCheckRequest`, `SessionAnomalyCheckResponse`.
3. **Security Middleware & Service Layer (`backend/app/services/vapt_service.py` & `backend/app/core/security_headers.py`)**:
   - Merkle root computation, VAPT probe executor, session anomaly score calculator.
4. **Endpoints (`backend/app/api/v1/endpoints/security_hardening.py`)**:
   - Register routes under `/api/v1/security/vapt`, `/api/v1/security/merkle`, `/api/v1/security/anomalies`.
5. **Backend Tests (`backend/tests/test_phase14.py`)**:
   - 10+ thorough tests validating all features 145–148.
6. **Frontend Service & Page**:
   - `vaptService.js`
   - `VaptSecurityDeskPage.jsx` with tabs for CERT-In Headers & OWASP Status, Merkle Tree Chain Verifier, Automated VAPT Scanner, and Session Anomaly Shield.
7. **Verification**:
   - Run pytest suite (all 130+ tests green) and `npm run build` (0 errors).
