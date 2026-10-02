import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute.jsx';

// Lazy load your page components
const Home = lazy(() => import('@/pages/modules/Home'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('@/pages/modules/NotFound'));
const Help = lazy(() => import('@/pages/modules/Help'));
const HowItWorks = lazy(() => import('@/pages/containers/HowItWorks.jsx'));
const LiveAuctionsFullPage = lazy(() => import('@/pages/features/LiveAuctionsFullPage.jsx'));
const BuyersProtectionFullPage = lazy(() => import('@/pages/containers/BuyersProtectionFullPage.jsx'));
const TermsAndConditions = lazy(() => import('@/pages/modules/TermsAndConditions.jsx'));
const StartSellingPage = lazy(() => import('@/pages/features/StartSellingPage.jsx'));
const Profile = lazy(() => import('@/pages/dashboard/Profile'));
const Wishlist = lazy(() => import('@/pages/dashboard/Wishlist'));
const ListedItems = lazy(() => import('@/pages/dashboard/ListedItems'));
const MyOrders = lazy(() => import('@/pages/dashboard/MyOrders'));
const YourAuctions = lazy(() => import('@/pages/dashboard/YourAuctions'));
const AuctionDetailsPage = lazy(() => import('@/pages/features/AuctionDetailsPage'));
const OrderDetailPage = lazy(() => import('@/pages/dashboard/OrderDetailPage'));
const CategoriesCarousel = lazy(() => import('@/pages/containers/CategoriesCarousel.jsx'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-purple-600 font-medium">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/help" element={<Help />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/auctions" element={<LiveAuctionsFullPage />} />
        <Route path="/buyers-protection-page" element={<BuyersProtectionFullPage />} />
        <Route path="/categories" element={<CategoriesCarousel />} />
        <Route path="/start-selling" element={<StartSellingPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/listed-items" element={<ProtectedRoute><ListedItems /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/your-auctions" element={<ProtectedRoute><YourAuctions /></ProtectedRoute>} />
        <Route path="/start-selling" element={<ProtectedRoute><StartSellingPage /></ProtectedRoute>} />
        <Route path="/order/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/auction/:auctionId" element={<AuctionDetailsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
