import axios from 'axios';
import useAuthStore from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { token, logout } = useAuthStore.getState();
    const isLogin = String(error.config?.url || '').includes('/auth/login');
    if (error.response?.status === 401 && token && !isLogin) {
      logout();
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.assign(`/auth/login?expired=1`);
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  if (!error?.response) return 'Cannot reach the server. Make sure the backend is running.';
  return fallback;
}

const API_ORIGIN = /^https?:\/\//.test(import.meta.env.VITE_API_URL || '') ? new URL(import.meta.env.VITE_API_URL).origin : '';

/** Resolves a stored upload path (e.g. `/uploads/students/x.jpg`) to a loadable URL. */
export function mediaUrl(path) {
  if (!path) return '';
  return path.startsWith('/uploads/') ? `${API_ORIGIN}${path}` : path;
}

export async function uploadImage(file, folder) {
  const body = new FormData();
  body.append('file', file);
  const { data } = await api.post('/admin/uploads/image', body, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data.url;
}

/** Uploads an image or PDF (folders `documents`, `payments`) and returns its `/uploads/...` path. */
export async function uploadFile(file, folder) {
  const body = new FormData();
  body.append('file', file);
  const { data } = await api.post('/admin/uploads/file', body, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data.url;
}

export default api;
