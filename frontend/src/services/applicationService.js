import api from './api';

export const applicationService = {
  // Scheme catalog
  getSchemes: async () => {
    const res = await api.get('/schemes');
    return res.data;
  },

  getSchemeById: async (schemeId) => {
    const res = await api.get(`/schemes/${schemeId}`);
    return res.data;
  },

  // Feature 22: Eligibility Pre-Check
  checkEligibility: async (schemeId, data) => {
    const res = await api.post(`/schemes/${schemeId}/check-eligibility`, data);
    return res.data;
  },

  // Features 15 & 16: Draft Save & 30s Auto-save
  saveDraft: async (draftPayload) => {
    const res = await api.post('/applications/draft', draftPayload);
    return res.data;
  },

  getDraft: async (schemeId) => {
    const res = await api.get(`/applications/draft/${schemeId}`);
    return res.data;
  },

  // Feature 19: Final Submission
  submitApplication: async (payload) => {
    const res = await api.post('/applications/submit', payload);
    return res.data;
  },

  // Feature 14 & 21: Student Applications list
  getApplications: async () => {
    const res = await api.get('/applications');
    return res.data;
  },

  // Feature 18: Preview Application
  getApplicationById: async (id) => {
    const res = await api.get(`/applications/${id}`);
    return res.data;
  },

  updateDraftApplication: async (id, data) => {
    const res = await api.put(`/applications/${id}`, data);
    return res.data;
  },

  // Feature 20: Application Cloning
  cloneApplication: async (id, targetSchemeId) => {
    const res = await api.post(`/applications/${id}/clone?target_scheme_id=${targetSchemeId}`);
    return res.data;
  },

  // Feature 21: Multi-Scheme Batch Application
  multiApply: async (payload) => {
    const res = await api.post('/applications/multi-apply', payload);
    return res.data;
  },

  // Feature 23: Application Status Timeline
  getApplicationTimeline: async (id) => {
    const res = await api.get(`/applications/${id}/timeline`);
    return res.data;
  },

  // Feature 24: Download Submitted Form PDF
  exportApplicationPdf: async (id) => {
    const res = await api.get(`/applications/${id}/export-pdf`, {
      responseType: 'blob'
    });
    return res.data;
  },

  // Feature 25: Application Withdrawal
  withdrawApplication: async (id, reason) => {
    const res = await api.post(`/applications/${id}/withdraw`, { reason });
    return res.data;
  },

  // Feature 26: Re-application Support
  reapplyApplication: async (id) => {
    const res = await api.post(`/applications/${id}/reapply`);
    return res.data;
  }
};

export default applicationService;
