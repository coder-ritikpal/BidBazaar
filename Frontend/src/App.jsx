import React, { useEffect, useState } from 'react';
import Navbar from './pages/modules/Navbar'
import AppRoutes from './routes/Routes.jsx'
import { ToastContainer, toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from './utils/api';
import Loading from './pages/modules/Loading';

const App = () => {
  const theme = useThemeStore((state) => state.theme);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const login = useAuthStore((state) => state.login);
  const showGoogleLoginToast = useAuthStore((state) => state.showGoogleLoginToast);
  const clearGoogleLoginToast = useAuthStore((state) => state.clearGoogleLoginToast);
  const navigate = useNavigate();

  const [isWakingUp, setIsWakingUp] = useState(true);

  // Synchronize theme with document and body to prevent white overflow stripes
  useEffect(() => {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#050510';
      document.body.style.backgroundColor = '#050510';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f9fafb';
      document.body.style.backgroundColor = '#f9fafb';
    }
  }, [theme]);

  useEffect(() => {
    // Wake up backend services logic
    const wakeUpServices = async () => {
      // 1. Critical services needed immediately
      const criticalUrls = [
        import.meta.env.VITE_API_URL_DASHBOARD,
        import.meta.env.VITE_API_URL_AUTH,
        import.meta.env.VITE_API_URL_FEATURES, // Auctions
      ].filter(Boolean); // Filter out undefined if missing in .env

      // 2. Services that can wake up quietly in the background
      const backgroundUrls = [
        import.meta.env.VITE_API_URL_INVENTORY,
        import.meta.env.VITE_API_URL_CART,
        import.meta.env.VITE_API_URL_PAYMENT,
        import.meta.env.VITE_API_URL_MAIL
      ].filter(Boolean);

      // Start waking background services quietly (fire-and-forget)
      backgroundUrls.forEach(url => {
         axios.get(url).catch(() => {});
      });

      if (criticalUrls.length > 0) {
        // Wait ONLY for critical services
        const criticalRequests = criticalUrls.map(url => axios.get(url));
        await Promise.allSettled(criticalRequests);
      } else {
        // Fallback in case env is not set up correctly yet, wait a small timeout
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setIsWakingUp(false);
    };

    wakeUpServices();
  }, []);

  useEffect(() => {
    // Handle Google OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const authFlow = params.get('auth_flow');

    if (code) {
      api.post(`/dashboard/auth/google/exchange`, { code })
        .then(response => {
          const { user, token } = response.data;
          login(user, token, 'google');
          window.history.replaceState({}, document.title, window.location.pathname); // Clean up URL
          if (authFlow) sessionStorage.setItem('auth_flow', authFlow);

          const redirectPath = sessionStorage.getItem('redirect_after_login');
          if (redirectPath) {
            sessionStorage.removeItem('redirect_after_login');
            navigate(redirectPath, { replace: true });
          }
        })
        .catch(e => {
          console.error("Failed to exchange code:", e);
          toast.error("Google sign-in failed. Please try again.");
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .finally(() => {
          checkAuthStatus();
        });
    } else {
      checkAuthStatus();
    }
  }, [checkAuthStatus, login, navigate]);

  useEffect(() => {
    if (showGoogleLoginToast) {
      toast.success(showGoogleLoginToast, {
        toastId: 'google-login-success'
      });
      clearGoogleLoginToast();
    }
  }, [showGoogleLoginToast, clearGoogleLoginToast]);

  if (isWakingUp) {
    return <Loading />;
  }

  return (
    <>
      <Navbar />
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={true} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <AppRoutes />
    </>
  )
}

export default App
