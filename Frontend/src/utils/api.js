import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// In development Vite proxies this relative URL.  A static Netlify deployment
// has no `/api` server, so production must use the deployed Dashboard BFF.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    // Reading directly from localStorage is more robust against race conditions on app startup.
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
