import api from './api';

export const scrutinyService = {
  // Feature 48 & 57: Scrutiny Dashboard Statistics & Risk Counts
  getDashboardStats: async () => {
    const response = await api.get('/scrutiny/dashboard-stats');
    return response.data;
  },

  // Feature 48: Filterable Scrutiny Queue
  getApplications: async (params = {}) => {
    const response = await api.get('/scrutiny/applications', { params });
    return response.data;
  },

  // Comprehensive Welfare Officer Scrutiny Dossier
  getDossier: async (id) => {
    const response = await api.get(`/scrutiny/applications/${id}/dossier`);
    return response.data;
  },

  // Features 49, 50, 51, 52, 54, 55: Automated Cross-Verification Stubs
  crossVerifyCertificate: async (id, data) => {
    const response = await api.post(`/scrutiny/applications/${id}/cross-verify`, data);
    return response.data;
  },

  // Feature 53: Trigger Multi-vector Duplicate Scan
  runDeduplication: async (id) => {
    const response = await api.post(`/scrutiny/applications/${id}/run-deduplication`);
    return response.data;
  },

  // Features 48 & 58: Submit Scrutiny Action with Mandatory Checklist Sign-off
  submitScrutinyAction: async (id, data) => {
    const response = await api.post(`/scrutiny/applications/${id}/action`, data);
    return response.data;
  },

  // Feature 56: Record Physical Spot Inspection
  recordPhysicalInspection: async (id, data) => {
    const response = await api.post(`/scrutiny/applications/${id}/physical-inspection`, data);
    return response.data;
  },

  // Feature 53: Clear Duplicate Flag with Justification
  clearDuplicateFlag: async (flagId, data) => {
    const response = await api.post(`/scrutiny/flags/${flagId}/clear`, data);
    return response.data;
  }
};

export default scrutinyService;
