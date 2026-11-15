import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_CORE_API_URL || 'http://localhost:8081',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stip_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.includes('/api/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('stip_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
