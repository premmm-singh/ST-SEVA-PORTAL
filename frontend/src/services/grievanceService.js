import api from './api';

export const grievanceService = {
  // F-96: File a new grievance
  fileGrievance: async (payload) => {
    const response = await api.post('/grievances/', payload);
    return response.data;
  },

  // List complainant's grievances
  getMyGrievances: async () => {
    const response = await api.get('/grievances/my-grievances');
    return response.data;
  },

  // F-101: Public tracker without authentication
  trackPublicGrievance: async (ticketNumber) => {
    const response = await api.get(`/grievances/track/${ticketNumber}`);
    return response.data;
  },

  // Get full grievance details
  getGrievanceById: async (id) => {
    const response = await api.get(`/grievances/${id}`);
    return response.data;
  },

  // F-103: Complainant appeal resolution
  appealGrievance: async (id, payload) => {
    const response = await api.post(`/grievances/${id}/appeal`, payload);
    return response.data;
  },

  // F-98: Officer review desk queue
  getOfficerQueue: async (params = {}) => {
    const response = await api.get('/grievances/officer/queue', { params });
    return response.data;
  },

  // F-102: Officer status update and ATR closure
  takeOfficerAction: async (id, payload) => {
    const response = await api.post(`/grievances/${id}/action`, payload);
    return response.data;
  },

  // F-100: Schedule dispute hearing
  scheduleHearing: async (id, payload) => {
    const response = await api.post(`/grievances/${id}/schedule-hearing`, payload);
    return response.data;
  },

  // Update hearing outcome
  updateHearingOutcome: async (hearingId, payload) => {
    const response = await api.post(`/grievances/hearing/${hearingId}/outcome`, payload);
    return response.data;
  },

  // F-99: Trigger SLA auto-escalation check
  runSlaEscalations: async () => {
    const response = await api.post('/grievances/sla/run-escalations');
    return response.data;
  },

  // F-104: Smart FAQ and Knowledgebase search
  getFaqArticles: async (params = {}) => {
    const response = await api.get('/grievances/helpdesk/faq', { params });
    return response.data;
  },

  // Mark FAQ article view
  recordArticleView: async (articleId) => {
    const response = await api.post(`/grievances/helpdesk/faq/${articleId}/view`);
    return response.data;
  },

  // Create new FAQ article
  createFaqArticle: async (payload) => {
    const response = await api.post('/grievances/helpdesk/faq', payload);
    return response.data;
  },

  // F-105: WhatsApp Bot simulator
  interactWhatsAppBot: async (payload) => {
    const response = await api.post('/grievances/whatsapp-bot', payload);
    return response.data;
  },

  // F-106: CPGRAMS / Jansamvad external ingestion
  syncExternalGrievance: async (payload) => {
    const response = await api.post('/grievances/sync-external', payload);
    return response.data;
  },

  // F-107: Grievance Analytics & Heatmap
  getAnalyticsDashboard: async () => {
    const response = await api.get('/grievances/analytics/dashboard');
    return response.data;
  }
};
