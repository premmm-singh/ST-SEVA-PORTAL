import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate client device fingerprint
export const getDeviceFingerprint = () => {
  let fp = localStorage.getItem('st_seva_fp');
  if (!fp) {
    const raw = `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
    fp = btoa(raw).slice(0, 32);
    localStorage.setItem('st_seva_fp', fp);
  }
  return fp;
};

// Request interceptor to attach token & fingerprint
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('st_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
  return config;
});

// Response interceptor to handle token rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('st_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
          const { access_token, refresh_token } = res.data;
          localStorage.setItem('st_access_token', access_token);
          localStorage.setItem('st_refresh_token', refresh_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('st_access_token');
          localStorage.removeItem('st_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
