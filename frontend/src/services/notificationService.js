import api from './api';

export const notificationService = {
  // Fetch user's in-app notifications
  getMyNotifications: async (unreadOnly = false, limit = 50) => {
    const response = await api.get('/notifications/my-notifications', {
      params: { unread_only: unreadOnly, limit }
    });
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/mark-read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  // Fetch communication preferences & DND settings
  getPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  // Update communication preferences
  updatePreferences: async (payload) => {
    const response = await api.put('/notifications/preferences', payload);
    return response.data;
  },

  // Officer: Dispatch targeted broadcast campaign
  dispatchBroadcast: async (payload) => {
    const response = await api.post('/notifications/broadcast', payload);
    return response.data;
  },

  // Officer: List historical broadcast campaigns
  getBroadcasts: async () => {
    const response = await api.get('/notifications/broadcasts');
    return response.data;
  },

  // Trigger automated lifecycle event
  triggerEvent: async (payload) => {
    const response = await api.post('/notifications/trigger-event', payload);
    return response.data;
  },

  // Run pending defect deadline chasers
  runDeadlineChasers: async () => {
    const response = await api.post('/notifications/chasers/run');
    return response.data;
  },

  // Officer: Export TRAI DLT delivery compliance logs
  getTraiComplianceLogs: async () => {
    const response = await api.get('/notifications/audit/trai-compliance');
    return response.data;
  }
};

export default notificationService;
