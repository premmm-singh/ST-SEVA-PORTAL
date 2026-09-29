import api from './api';

const allocationService = {
  // Cycle Management
  getAllocationCycles: async () => {
    const res = await api.get('/allocation/cycles');
    return res.data;
  },

  getAllocationCycle: async (cycleId) => {
    const res = await api.get(`/allocation/cycles/${cycleId}`);
    return res.data;
  },

  createAllocationCycle: async (payload) => {
    const res = await api.post('/allocation/cycles', payload);
    return res.data;
  },

  // Feature 66: Simulation & Dry Run
  simulateAllocation: async (cycleId, dryRun = true) => {
    const res = await api.post(`/allocation/cycles/${cycleId}/simulate?dry_run=${dryRun}`);
    return res.data;
  },

  // Feature 59 & 61: Merit List & Ranks
  getMeritList: async (cycleId) => {
    const res = await api.get(`/allocation/cycles/${cycleId}/merit-list`);
    return res.data;
  },

  // Allocation Results
  getAllocationResults: async (cycleId, statusFilter = null) => {
    const url = statusFilter
      ? `/allocation/cycles/${cycleId}/results?status_filter=${statusFilter}`
      : `/allocation/cycles/${cycleId}/results`;
    const res = await api.get(url);
    return res.data;
  },

  // Feature 62: Waitlist Auto-Promotion
  promoteWaitlistCandidate: async (cycleId) => {
    const res = await api.post(`/allocation/cycles/${cycleId}/promote-waitlist`);
    return res.data;
  },

  // Feature 63: Scheme Switching
  switchSchemeOffer: async (fromCycleId, toCycleId) => {
    const res = await api.post('/allocation/switch-scheme', {
      from_cycle_id: fromCycleId,
      to_cycle_id: toCycleId,
    });
    return res.data;
  },

  // Feature 65: Renewal Threshold Validator
  checkRenewalEligibility: async (marksPercentage, isPvtg = false) => {
    const res = await api.post('/allocation/check-renewal', {
      marks_percentage: marksPercentage,
      is_pvtg: isPvtg,
    });
    return res.data;
  },

  // Feature 67: Objection Window
  openObjectionWindow: async (cycleId, days = 7) => {
    const res = await api.post(`/allocation/cycles/${cycleId}/open-objection-window?days=${days}`);
    return res.data;
  },

  fileMeritObjection: async (cycleId, payload) => {
    const res = await api.post(`/allocation/cycles/${cycleId}/objections`, payload);
    return res.data;
  },

  getCycleObjections: async (cycleId) => {
    const res = await api.get(`/allocation/cycles/${cycleId}/objections`);
    return res.data;
  },

  resolveMeritObjection: async (objectionId, payload) => {
    const res = await api.post(`/allocation/objections/${objectionId}/resolve`, payload);
    return res.data;
  },

  // Feature 68: Final Sanction Order
  generateSanctionOrder: async (cycleId) => {
    const res = await api.post(`/allocation/cycles/${cycleId}/generate-sanction-order`);
    return res.data;
  },

  getCycleSanctionOrders: async (cycleId) => {
    const res = await api.get(`/allocation/cycles/${cycleId}/sanction-orders`);
    return res.data;
  },

  // Feature 70: Immutable Audit Trail
  getCycleAuditTrail: async (cycleId) => {
    const res = await api.get(`/allocation/cycles/${cycleId}/audit-trail`);
    return res.data;
  },

  // Student portal queries
  getMyAllocations: async () => {
    const res = await api.get('/allocation/student/my-allocations');
    return res.data;
  },
};

export default allocationService;
