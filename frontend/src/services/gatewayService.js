import api from './api';

export const gatewayService = {
  // F-129: DigiLocker NeGD Production Gateway
  pullDigiLockerDocument: async (uri, consentArtifactId = null) => {
    const response = await api.post('/gateways/digilocker/pull-document', {
      uri,
      consent_artifact_id: consentArtifactId
    });
    return response.data;
  },

  // F-130: UIDAI Aadhaar Vault & Tokenization Engine
  tokenizeAadhaar: async (rawAadhaarNumber) => {
    const response = await api.post('/gateways/aadhaar/tokenize', {
      raw_aadhaar_number: rawAadhaarNumber
    });
    return response.data;
  },

  // F-131: NPCI Aadhaar Payment Bridge (APB) Mapper Ingestion
  syncNpciMapper: async (batchReference, records) => {
    const response = await api.post('/gateways/npci/sync-mapper', {
      batch_reference: batchReference,
      records
    });
    return response.data;
  },

  lookupNpciStatus: async (vaultToken) => {
    const response = await api.get(`/gateways/npci/lookup/${encodeURIComponent(vaultToken)}`);
    return response.data;
  },

  // F-132: PFMS Core XML Exchange & Digital Signature (DSC)
  dispatchPfmsBatch: async (batchId, dscTokenId = 'DSC-GOV-JH-2026-X509') => {
    const response = await api.post('/gateways/pfms/dispatch-batch', {
      batch_id: batchId,
      dsc_token_id: dscTokenId
    });
    return response.data;
  },

  // F-133: AISHE Master Directory Sync & College Verification API
  verifyAisheCode: async (aisheCode) => {
    const response = await api.get(`/gateways/aishe/verify/${encodeURIComponent(aisheCode)}`);
    return response.data;
  },

  // F-134: Academic Examination Boards (CBSE/JAC) e-Marksheet Webhooks
  verifyAcademicMarks: async (boardName, rollCode, rollNumber, passingYear = 2025) => {
    const response = await api.post('/gateways/academic/verify-marks', {
      board_name: boardName,
      roll_code: rollCode,
      roll_number: rollNumber,
      passing_year: passingYear
    });
    return response.data;
  },

  // F-135: JharSewa / e-District Certificate API
  verifyJharSewaCertificate: async (certificateNumber, applicantName, certificateType = 'CASTE') => {
    const response = await api.post('/gateways/jharsewa/verify-certificate', {
      certificate_number: certificateNumber,
      applicant_name: applicantName,
      certificate_type: certificateType
    });
    return response.data;
  },

  // F-136: UMANG Mobile App REST Gateway & SSO
  exchangeUmangSso: async (umangAuthToken, mobileNumber) => {
    const response = await api.post('/gateways/umang/sso-exchange', {
      umang_auth_token: umangAuthToken,
      mobile_number: mobileNumber
    });
    return response.data;
  },

  // F-137: Webhook Subscription Hub & Outbound Event Dispatcher
  subscribeWebhook: async (payload) => {
    const response = await api.post('/gateways/webhooks/subscribe', payload);
    return response.data;
  },

  getWebhookLogs: async (limit = 50) => {
    const response = await api.get(`/gateways/webhooks/logs?limit=${limit}`);
    return response.data;
  },

  // F-138: External API Rate Limiting & DDoS Shield
  checkRateLimit: async () => {
    const response = await api.get('/gateways/rate-limit/check');
    return response.data;
  }
};

export default gatewayService;
