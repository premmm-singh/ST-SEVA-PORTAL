import api from './api';

export const adminService = {
  // F-119: Hierarchical Role-Based Access Control (RBAC) Matrix
  getRbacMatrix: async () => {
    const response = await api.get('/admin/rbac/matrix');
    return response.data;
  },

  setRolePermission: async (payload) => {
    const response = await api.post('/admin/rbac/permissions', payload);
    return response.data;
  },

  // F-121: District & Taluk Hierarchy & Officer Transfer / Delegation Workflow
  getActiveDelegations: async (district = null) => {
    let url = '/admin/delegations/active';
    if (district) url += `?district=${encodeURIComponent(district)}`;
    const response = await api.get(url);
    return response.data;
  },

  createDelegation: async (payload) => {
    const response = await api.post('/admin/delegations', payload);
    return response.data;
  },

  revokeDelegation: async (delegationId) => {
    const response = await api.post(`/admin/delegations/${delegationId}/revoke`);
    return response.data;
  },

  // F-122: System Configuration Registry & Dynamic Parameter Tuning
  getSystemConfigs: async (category = null) => {
    let url = '/admin/configs';
    if (category) url += `?category=${encodeURIComponent(category)}`;
    const response = await api.get(url);
    return response.data;
  },

  updateSystemConfig: async (configKey, payload) => {
    const response = await api.put(`/admin/configs/${encodeURIComponent(configKey)}`, payload);
    return response.data;
  },

  // F-124: Audit Trail Log Explorer with Immutable SHA-256 Checksums
  getAuditTrail: async (limit = 50, offset = 0, resource = null) => {
    let url = `/admin/audit-trail?limit=${limit}&offset=${offset}`;
    if (resource) url += `&resource=${encodeURIComponent(resource)}`;
    const response = await api.get(url);
    return response.data;
  },

  // F-125: Super-Admin Officer Impersonation / Shadow Mode
  startImpersonation: async (payload) => {
    const response = await api.post('/admin/impersonate/start', payload);
    return response.data;
  },

  // F-126: Multi-Tenant Architecture & State White-Labeling
  getTenantConfig: async (stateCode = 'JH') => {
    const response = await api.get(`/admin/tenant-config?state_code=${encodeURIComponent(stateCode)}`);
    return response.data;
  },

  updateTenantConfig: async (payload, stateCode = 'JH') => {
    const response = await api.put(`/admin/tenant-config?state_code=${encodeURIComponent(stateCode)}`, payload);
    return response.data;
  },

  // F-127: System Health, Server Metrics & Uptime Monitoring Dashboard
  getSystemHealth: async () => {
    const response = await api.get('/admin/system-health');
    return response.data;
  },

  // F-128: Data Purging, GDPR/DPDP Act 2023 Compliance & Retention Policy Enforcement
  executeRetentionPurge: async (payload) => {
    const response = await api.post('/admin/retention/run-purge', payload);
    return response.data;
  }
};

export default adminService;
