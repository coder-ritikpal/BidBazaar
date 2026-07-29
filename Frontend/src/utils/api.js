import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: '/api', // The vite proxy will handle this
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