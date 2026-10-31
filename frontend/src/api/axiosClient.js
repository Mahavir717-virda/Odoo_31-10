import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

const baseURL =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) ||
  '/api';

const axiosClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject Bearer token
axiosClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS?.auth_token || 'auth_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // LocalStorage access may fail in restricted environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap response data, normalize errors, handle 401/403
axiosClient.interceptors.response.use(
  (response) => {
    // Response unwrapping: return data directly
    return response.data;
  },
  (error) => {
    const status = error?.response?.status;
    const responseData = error?.response?.data;

    // Build user-friendly normalized message
    const message =
      (typeof responseData === 'string' && responseData) ||
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      'An unexpected error occurred. Please try again.';

    // Create a normalized Error instance with metadata
    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.data = responseData;
    normalizedError.code = error?.code;
    normalizedError.isAxiosError = true;
    normalizedError.originalError = error;

    // Handle authentication & authorization redirects
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;

      if (status === 401) {
        try {
          localStorage.removeItem(STORAGE_KEYS?.auth_token || 'auth_token');
          localStorage.removeItem(STORAGE_KEYS?.auth_user || 'auth_user');
        } catch {
          // ignore
        }
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      } else if (status === 403) {
        if (!currentPath.startsWith('/forbidden')) {
          window.location.href = '/forbidden';
        }
      }
    }

    return Promise.reject(normalizedError);
  }
);

export default axiosClient;

