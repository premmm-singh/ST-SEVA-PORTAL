import api from './api';

export const vaptService = {
  // F-145: OWASP Top-10 & CERT-In Compliance Guardrails
  getSecurityHeadersStatus: async () => {
    const response = await api.get('/vapt/headers/status');
    return response.data;
  },

  testInputSanitization: async (payload, injectionType = 'SQLI') => {
    const response = await api.post(`/vapt/sanitize/probe?payload=${encodeURIComponent(payload)}&injection_type=${encodeURIComponent(injectionType)}`);
    return response.data;
  },

  // F-146: Anti-Tamper Immutable Hash Chains & Merkle Trees for Audit Trails
  recordMerkleLeaf: async (payload) => {
    const response = await api.post('/vapt/merkle/record-leaf', payload);
    return response.data;
  },

  verifyMerkleNode: async (recordId) => {
    const response = await api.get(`/vapt/merkle/verify/${encodeURIComponent(recordId)}`);
    return response.data;
  },

  // F-147: Automated Vulnerability & Penetration Testing (VAPT) Simulation Testbed
  runVaptScan: async (payload = {}) => {
    const response = await api.post('/vapt/scan/run', payload);
    return response.data;
  },

  // F-148: Session Hijacking Defense, IP Roaming Anomaly Detection & Adaptive Step-Up Auth
  checkSessionAnomaly: async (payload) => {
    const response = await api.post('/vapt/sessions/anomaly-check', payload);
    return response.data;
  }
};

export default vaptService;
