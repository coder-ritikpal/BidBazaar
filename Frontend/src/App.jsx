import React, { useEffect } from 'react';
import Navbar from './pages/modules/Navbar'
import AppRoutes from './routes/Routes.jsx'
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import { useAuthStore } from '@/store/authStore'
// import { useNavigate } from 'react-router-dom'; // Uncomment if you need to navigate after login

const App = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const login = useAuthStore((state) => state.login); // Get the login action
  const showGoogleLoginToast = useAuthStore((state) => state.showGoogleLoginToast);
  const clearGoogleLoginToast = useAuthStore((state) => state.clearGoogleLoginToast);
  // const navigate = useNavigate(); // Uncomment if you need to navigate after login

  useEffect(() => {
    // Handle Google OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userString = params.get('user');
    const authFlow = params.get('auth_flow');

    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        login(user, token, 'google');
        window.history.replaceState({}, document.title, window.location.pathname); // Clean up URL
        if (authFlow) sessionStorage.setItem('auth_flow', authFlow);
      } catch (e) {
        console.error("Failed to parse user data from Google OAuth callback:", e);
        // Optionally redirect to login with error, or show toast
        // navigate('/login?error=google_auth_failed');
      }
    }
    checkAuthStatus();
  }, [checkAuthStatus, login]); // Add login to dependency array

  useEffect(() => {
    if (showGoogleLoginToast) {
      toast.success(showGoogleLoginToast, {
        toastId: 'google-login-success' // Prevent duplicate toasts
      });
      clearGoogleLoginToast(); // Clear the flag immediately after showing the toast
    }
  }, [showGoogleLoginToast, clearGoogleLoginToast]);

  return (
    <>
      <Navbar />
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={true} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" /> {/* Add ToastContainer */}
      <AppRoutes />
    </>
  )
}

export default App
