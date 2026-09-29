import api from './api';

export const institutionService = {
  // Feature 37: Master Lookup of Accredited Higher Education and Schools
  lookupInstitutions: async (query) => {
    const response = await api.get(`/institutions/lookup?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Feature 37: Register Institution Nodal Officer
  registerInstitution: async (data) => {
    const response = await api.post('/institutions/register', data);
    return response.data;
  },

  // Institution Profile
  getInstitutionProfile: async () => {
    const response = await api.get('/institutions/profile');
    return response.data;
  },

  // Feature 47: Institution Dashboard Statistics
  getDashboardStats: async () => {
    const response = await api.get('/institutions/dashboard-stats');
    return response.data;
  },

  // List Student Applications mapped to Institution
  getApplications: async (params = {}) => {
    const response = await api.get('/institutions/applications', { params });
    return response.data;
  },

  // Features 38, 39, 41, 42: Comprehensive Student Verification Dossier
  getApplicationDetails: async (id) => {
    const response = await api.get(`/institutions/applications/${id}/details`);
    return response.data;
  },

  // Features 38, 40, 46: Verify Student Bonafide, 75% Attendance & Digital Stamp
  verifyApplication: async (id, data) => {
    const response = await api.post(`/institutions/applications/${id}/verify`, data);
    return response.data;
  },

  // Feature 44: Return Defective Application with Deadline
  returnDefectiveApplication: async (id, data) => {
    const response = await api.post(`/institutions/applications/${id}/return-defective`, data);
    return response.data;
  },

  // Feature 43: Bulk Verification Workflow
  bulkVerifyApplications: async (data) => {
    const response = await api.post('/institutions/applications/bulk-verify', data);
    return response.data;
  },

  // Feature 39: Fee Structures
  getFeeStructures: async () => {
    const response = await api.get('/institutions/fee-structures');
    return response.data;
  },

  createFeeStructure: async (data) => {
    const response = await api.post('/institutions/fee-structures', data);
    return response.data;
  },

  // Feature 45: Grievances
  getGrievances: async () => {
    const response = await api.get('/institutions/grievances');
    return response.data;
  },

  submitGrievance: async (data) => {
    const response = await api.post('/institutions/grievances', data);
    return response.data;
  }
};

export default institutionService;
