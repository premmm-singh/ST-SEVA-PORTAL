import api from './api';

export const productionService = {
  // Pre-flight Production Diagnostics
  getPreflightDiagnostics: async () => {
    const response = await api.get('/production/preflight');
    return response.data;
  },

  // Disaster Recovery Failover Simulation Drill
  simulateDrFailover: async (targetSecondaryRegion = 'National DR Centre (NDC) Hyderabad') => {
    const response = await api.post('/production/disaster-recovery/simulate-failover', {
      target_secondary_region: targetSecondaryRegion,
      simulation_mode: true
    });
    return response.data;
  },

  // Synthetic End-to-End Lifecycle Journey Smoke Runner
  runSyntheticJourney: async () => {
    const response = await api.post('/production/smoke-test/run-full-journey');
    return response.data;
  }
};

export default productionService;
