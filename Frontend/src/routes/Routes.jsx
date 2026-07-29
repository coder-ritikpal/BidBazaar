import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import your page components
import Home from '@/pages/modules/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword'; // Import ForgotPassword
import NotFound from '@/pages/modules/NotFound';
import Help from '@/pages/modules/Help';
import HowItWorks from '@/pages/containers/HowItWorks.jsx';
import LiveAuctionsFullPage from '@/pages/features/LiveAuctionsFullPage.jsx'; // Import the renamed full page
import BuyersProtectionFullPage from '@/pages/containers/BuyersProtectionFullPage.jsx';
import TermsAndConditions from '@/pages/modules/TermsAndConditions.jsx';
import StartSellingPage from '@/pages/features/StartSellingPage.jsx'; // Import the new StartSellingPage
import Profile from '@/pages/dashboard/Profile';
import Wishlist from '@/pages/dashboard/Wishlist';
import ListedItems from '@/pages/dashboard/ListedItems';
import MyOrders from '@/pages/dashboard/MyOrders';
import YourAuctions from '@/pages/dashboard/YourAuctions';
import AuctionDetailsPage from '@/pages/features/AuctionDetailsPage';
import OrderDetailPage from '@/pages/dashboard/OrderDetailPage';
import CategoriesCarousel from '@/pages/containers/CategoriesCarousel.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/help" element={<Help />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/auctions" element={<LiveAuctionsFullPage />} /> {/* Route for the full auctions page */}
      <Route path="/buyers-protection-page" element={<BuyersProtectionFullPage />} />
      <Route path="/categories" element={<CategoriesCarousel />} />
      <Route path="/start-selling" element={<StartSellingPage />} /> {/* Route for the Start Selling page */}
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/listed-items" element={<ListedItems />} />
      <Route path="/orders" element={<MyOrders />} />
      <Route path="/your-auctions" element={<YourAuctions />} />
      <Route path="/auction/:auctionId" element={<AuctionDetailsPage />} />
      <Route path="/order/:orderId" element={<OrderDetailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;