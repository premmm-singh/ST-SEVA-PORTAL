# Phase 13 Implementation Plan: Mobile Readiness, Offline PWA & Vernacular Support (Features 139–144)

## 1. Objectives & Overview
Phase 13 addresses field realities in remote tribal belts of Jharkhand (e.g., West Singhbhum, Simdega, Khunti, Dumka), where 2G/3G low-bandwidth connectivity, regional languages (Hindi, Santhali in Ol Chiki script, Ho, Mundari), and mobile device usage are paramount.

Features 139–144 empower students, field vanguards, and rural CSC operators to access services seamlessly, even while offline, and sync securely once online.

---

## 2. Feature Breakdown (Features 139–144)

### Feature 139: Progressive Web App (PWA) Manifest, Service Worker & Offline Cache
- **PWA Manifest**: `manifest.json` configured with government branding, icons, display mode `standalone`, theme color `#005696`, background color `#ffffff`.
- **Service Worker (`sw.js`)**: Cache-first strategy for static assets, network-first for vital API endpoints, and fallback offline shells for smooth navigation when disconnected.
- **PWA Installation Banner**: Prompt for users on Android/iOS/Desktop.

### Feature 140: Offline Application Draft Save & IndexedDB Sync Engine
- **Backend Model & Endpoints**:
  - `OfflineSyncQueue` model storing client device uuid, sync status (`PENDING`, `SYNCED`, `CONFLICT`), payload, and timestamp.
  - `POST /api/v1/mobile/sync/offline-batch`: Accepts an array of queued actions performed while offline (draft updates, grievance submissions, document uploads) and resolves them with idempotency tokens.
- **Frontend Sync Manager**: IndexedDB or local storage queue with automatic background sync when network connectivity is restored (`window.addEventListener('online')`).

### Feature 141: Vernacular Multi-Language Engine (English, Hindi, Santhali / Ol Chiki, Ho, Mundari)
- **Languages Supported**:
  1. English (`en`)
  2. Hindi (`hi` - हिन्दी)
  3. Santhali (`sat` - ᱥᱟᱱᱛᱟᱲᱤ / Ol Chiki script support)
  4. Ho (`hoc` - ᱦᱳ / Warang Chiti / Devanagari transliteration)
  5. Mundari (`unr` - मुण्डारी / Devanagari script)
- **Backend Translation Catalog & Language API**:
  - `GET /api/v1/mobile/i18n/translations?lang={code}`: Delivers localized UI strings, scheme names, and error messages.
- **Frontend Vernacular Context**:
  - `VernacularContext` with persistent language preference, instant dynamic switching across headers, tabs, buttons, and notifications.

### Feature 142: Low-Bandwidth 2G/3G Optimization & Adaptive Compression
- **Backend / Client Engine**:
  - `POST /api/v1/mobile/optimize/document`: Adaptive client-side / server-side image and PDF compressor down to <100KB for 2G networks without loss of legibility.
  - Network quality detection (`navigator.connection.effectiveType`) to toggle "Data Saver" mode (strips heavy animations, lazy loads assets).

### Feature 143: Screen Reader WCAG 2.1 AA Compliance & Voice Assist Audio Prompts
- **Speech Synthesis / Audio Repository**:
  - `GET /api/v1/mobile/accessibility/audio-prompt?key={key}&lang={code}`: Synthesized audio clips in Hindi/Santhali explaining application stages and document upload instructions for non-literate guardians.
  - High-contrast mode, text-to-speech triggers, ARIA live announcements for screen readers.

### Feature 144: Mobile Device Biometric Auth (WebAuthn / FIDO2 Passkeys)
- **Backend Model & Endpoints**:
  - `BiometricCredential` model storing credential ID, public key, sign counter, user ID.
  - `POST /api/v1/mobile/auth/webauthn/register-options`: Generates registration challenge.
  - `POST /api/v1/mobile/auth/webauthn/register-verify`: Validates credential creation.
  - `POST /api/v1/mobile/auth/webauthn/login-options`: Generates authentication challenge.
  - `POST /api/v1/mobile/auth/webauthn/login-verify`: Validates device signature (fingerprint/face unlock) and issues JWT.

---

## 3. Implementation Steps

1. **Backend Database Models (`backend/app/db/models/mobile.py`)**:
   - `OfflineSyncQueue`
   - `BiometricCredential`
   - Register in `backend/app/db/models/__init__.py` and create tables.
2. **Pydantic Schemas (`backend/app/schemas/mobile.py`)**:
   - `OfflineSyncBatchRequest`, `OfflineSyncResponse`, `TranslationResponse`, `DocumentCompressionRequest`, `WebAuthnChallengeResponse`, `WebAuthnVerifyRequest`.
3. **Service Layer (`backend/app/services/mobile_service.py`)**:
   - Offline batch conflict resolution, vernacular dictionary, document compression simulation, WebAuthn challenge verification.
4. **Endpoints (`backend/app/api/v1/endpoints/mobile.py`)**:
   - Register routes under `/api/v1/mobile`.
5. **Backend Tests (`backend/tests/test_phase13.py`)**:
   - 10+ thorough tests validating all features 139–144.
6. **Frontend Service & Utilities**:
   - `mobileService.js`
   - PWA setup (`manifest.json`, `sw.js` registration)
   - `VernacularContext.jsx` for language switching
7. **Frontend Page**:
   - `MobilePwaHubPage.jsx` demonstrating Offline Sync, Vernacular Switcher, Voice Prompt Player, Data Saver Mode, and WebAuthn Biometric enrollment.
8. **Verification**:
   - Run pytest suite (all 120+ tests green) and `npm run build` (0 errors).
