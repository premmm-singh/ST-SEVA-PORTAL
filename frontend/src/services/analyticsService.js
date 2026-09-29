import api from './api';

export const analyticsService = {
  // F-108: Central & State Macro Real-Time KPIs
  getExecutiveSummary: async (financialYear = '2026-2027') => {
    const response = await api.get(`/analytics/executive-summary?financial_year=${encodeURIComponent(financialYear)}`);
    return response.data;
  },

  // F-109: Interactive Geo-Spatial Heatmap across all 24 districts of Jharkhand
  getDistrictHeatmap: async (financialYear = '2026-2027') => {
    const response = await api.get(`/analytics/district-heatmap?financial_year=${encodeURIComponent(financialYear)}`);
    return response.data;
  },

  // F-110 & F-117: Demographic & Tribal Sub-Caste Equity Analysis & PVTG Surveillance
  getTribalDemographics: async () => {
    const response = await api.get('/analytics/demographics');
    return response.data;
  },

  // F-111: Financial Outlay, Treasury Drawdown & Budget Utilization Charts
  getBudgetUtilization: async (financialYear = '2026-2027') => {
    const response = await api.get(`/analytics/budget-utilization?financial_year=${encodeURIComponent(financialYear)}`);
    return response.data;
  },

  // F-112: Scrutiny Turnaround Time (TAT) & Bottleneck Identification
  getScrutinyTat: async () => {
    const response = await api.get('/analytics/scrutiny-tat');
    return response.data;
  },

  // F-113: Educational Institution Performance League Table & Defaulter Tracking
  getInstitutionLeagueTable: async () => {
    const response = await api.get('/analytics/institutions-ranking');
    return response.data;
  },

  // F-114: DBT Direct Bank Credit Success & Failure Analytics
  getDbtHealth: async () => {
    const response = await api.get('/analytics/dbt-health');
    return response.data;
  },

  // F-115: Automated Statutory CAG & Parliament Question (PQ) Report Exporter
  exportParliamentReport: async (payload) => {
    const response = await api.post('/analytics/export/parliament-report', payload);
    return response.data;
  },

  // F-116: Predictive Budget & Outlay Forecasting Engine
  getBudgetForecast: async (financialYear = '2026-2027') => {
    const response = await api.get(`/analytics/forecast?financial_year=${encodeURIComponent(financialYear)}`);
    return response.data;
  },

  // F-118: Executive Scheduled Digest Configuration
  createScheduledReport: async (payload) => {
    const response = await api.post('/analytics/scheduled-reports', payload);
    return response.data;
  }
};

export default analyticsService;
