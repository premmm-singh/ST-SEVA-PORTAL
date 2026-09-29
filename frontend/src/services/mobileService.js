import api from './api';

export const mobileService = {
  // F-140: Offline Application Draft Save & IndexedDB/Local Queue Sync Engine
  syncOfflineBatch: async (deviceId, items) => {
    const response = await api.post('/mobile/sync/offline-batch', {
      device_id: deviceId,
      items
    });
    return response.data;
  },

  // F-141: Vernacular Multi-Language Engine (English, Hindi, Santhali/Ol Chiki, Ho, Mundari)
  getTranslations: async (lang = 'en') => {
    const response = await api.get(`/mobile/i18n/translations?lang=${encodeURIComponent(lang)}`);
    return response.data;
  },

  // F-142: Low-Bandwidth 2G/3G Optimization & Adaptive Compression
  optimizeDocument: async (payload) => {
    const response = await api.post('/mobile/optimize/document', payload);
    return response.data;
  },

  // F-143: Screen Reader WCAG 2.1 AA Compliance & Voice Assist Audio Prompts
  getAudioPrompt: async (key = 'welcome_instructions', lang = 'hi') => {
    const response = await api.get(`/mobile/accessibility/audio-prompt?key=${encodeURIComponent(key)}&lang=${encodeURIComponent(lang)}`);
    return response.data;
  },

  // F-144: Mobile Device Biometric Auth (WebAuthn / FIDO2 Passkeys)
  getWebAuthnRegisterOptions: async (deviceName = 'Mobile Biometric Sensor') => {
    const response = await api.post('/mobile/auth/webauthn/register-options', {
      device_name: deviceName
    });
    return response.data;
  },

  verifyWebAuthnRegister: async (payload) => {
    const response = await api.post('/mobile/auth/webauthn/register-verify', payload);
    return response.data;
  },

  getWebAuthnLoginOptions: async (email) => {
    const response = await api.post(`/mobile/auth/webauthn/login-options?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  verifyWebAuthnLogin: async (payload) => {
    const response = await api.post('/mobile/auth/webauthn/login-verify', payload);
    return response.data;
  }
};

export default mobileService;
