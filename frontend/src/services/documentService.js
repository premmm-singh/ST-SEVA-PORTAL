import api from './api';

export const documentService = {
  // Feature 27 & 28: Multi-format upload with progress
  uploadDocument: async (formData, onProgress) => {
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  // Feature 31 & 32: List documents
  getDocuments: async (params = {}) => {
    const res = await api.get('/documents', { params });
    return res.data;
  },

  getDocumentDetails: async (docId) => {
    const res = await api.get(`/documents/${docId}`);
    return res.data;
  },

  // Feature 28: 15-minute signed URL
  getSignedUrl: async (docId, action = 'preview') => {
    const res = await api.get(`/documents/${docId}/signed-url`, {
      params: { action }
    });
    return res.data;
  },

  // Feature 30: Cryptographic SHA-256 integrity verification
  verifyIntegrity: async (docId) => {
    const res = await api.get(`/documents/${docId}/verify-integrity`);
    return res.data;
  },

  // Feature 32: Soft-delete document
  deleteDocument: async (docId) => {
    const res = await api.delete(`/documents/${docId}`);
    return res.data;
  },

  // Feature 34: Document expiry tracking
  getExpiringDocuments: async (days = 30) => {
    const res = await api.get('/documents/expiring-soon', {
      params: { days }
    });
    return res.data;
  },

  // Feature 35: Pull from DigiLocker Gateway
  pullFromDigiLocker: async (category, applicationId = null) => {
    const res = await api.post('/documents/digilocker-pull', {
      document_category: category,
      application_id: applicationId
    });
    return res.data;
  }
};

export default documentService;
