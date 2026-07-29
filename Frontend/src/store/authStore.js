import { create } from 'zustand';
import { useDashboardStore } from './dashboardStore';
import { useCartStore } from './cartStore';
import { useInventoryStore } from './inventoryStore';
import { updateProfile as updateProfileApi } from '../data/api.js';
import api from '@/utils/api';

export const useAuthStore = create((set, get) => ({
  isLoggedIn: !!localStorage.getItem('token'),
  user: null,
  token: localStorage.getItem('token'),
  loading: true, // Still true initially, until checkAuthStatus confirms user details
  loginMethod: null, // New state to store how the user logged in ('email' or 'google')
  showGoogleLoginToast: null,

  // Function to set user, login status, and store token in localStorage
  login: (userData, token, method = 'email') => {
    localStorage.setItem('token', token);
    set({ isLoggedIn: true, user: userData, token, loginMethod: method });
  },
  // Function to clear user and login status
  logout: async (redirect = true) => { // Added redirect parameter
    try {
      // Assuming a logout API endpoint exists on your backend
      await api.post('/dashboard/auth/logout');
      localStorage.removeItem('token'); // Clear token from localStorage
      set({ isLoggedIn: false, user: null, token: null, loginMethod: null, showGoogleLoginToast: null }); // Clear state
      // Clear user-specific data from other stores
      useCartStore.getState().clearCartData();
      useInventoryStore.getState().clearInventoryData();
    } catch (error) {
      console.error('Error during logout:', error);
      // Optionally handle error, e.g., show a message to the user
    }
  },
  // Clear user-specific data from other stores (moved here for clarity, can be called on logout)
  clearUserSpecificData: () => {
    useDashboardStore.getState().clearUserSpecificData();
  },

  // Function to check authentication status on app load
  checkAuthStatus: async () => {
    set({ loading: true });
    const token = localStorage.getItem('token');
    if (!token) {
      // No token in localStorage, so not logged in
      set({ isLoggedIn: false, user: null, token: null, loading: false });
      return;
    }

    try {
      const response = await api.get('/dashboard/profile/me');
      const user = response.data.user; // Assuming response.data contains { user: ... }
      // Infer login method based on user data (e.g., presence of googleId)
      const method = user.googleId ? 'google' : 'email';
      
      const authFlow = sessionStorage.getItem('auth_flow');
      let toastMessage = null;

      if (method === 'google' && (authFlow === 'google_login' || authFlow === 'google_register')) {
        toastMessage = authFlow === 'google_register' 
          ? 'Registration successful!' 
          : 'Authentication successful!';
        sessionStorage.removeItem('auth_flow');
      }
      // Token is already set from initialization, just update user and login status
      set({ isLoggedIn: true, user: user, loginMethod: method, showGoogleLoginToast: toastMessage });
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Auth status check failed:", error);
      }
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ECONNREFUSED')) { // Use optional chaining for error.message
        console.error("Network Error: Could not connect to the dashboard service. Please ensure it's running on http://localhost:3004.");
      }
      localStorage.removeItem('token'); // Clear invalid token
      set({ isLoggedIn: false, user: null, token: null, loginMethod: null, showGoogleLoginToast: null, error: error.message }); // Adding 'error' state for easier debugging
      sessionStorage.removeItem('auth_flow');
    } finally {
      set({ loading: false });
    }
  },

  clearGoogleLoginToast: () => set({ showGoogleLoginToast: null }),

  updateProfile: async (profileData) => {
    set({ loading: true });
    try {
      const response = await updateProfileApi(profileData);
      const updatedUser = response.data.user;
      set((state) => ({
        user: { ...state.user, ...updatedUser },
        loading: false,
      }));
      return updatedUser;
    } catch (error) {
      set({ loading: false });
      console.error('Error updating profile:', error);
      throw error;
    }
  },
}));