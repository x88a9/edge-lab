import axios, { AxiosError } from 'axios';

const baseURL: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: baseURL || 'http://localhost:8000',
});

// Attach Authorization header if token exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to /login
apiClient.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      try { localStorage.removeItem('token'); } catch {}
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;