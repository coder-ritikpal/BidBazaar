import api from '@/utils/api';

// --- Authentication API Calls (proxied through Dashboard BFF) ---

export const registerUser = async (userData) => {
  return api.post(`/dashboard/auth/register`, userData);
};

export const loginUser = async (credentials) => {
  return api.post(`/dashboard/auth/login`, credentials);
};

export const googleAuth = () => {
  // This will redirect the browser to the Google OAuth consent screen
  window.location.href = `/api/dashboard/auth/google`;
};

export const updateProfile = async (profileData) => {
  // This calls the dashboard BFF, which then forwards to the auth service
  return api.put(`/dashboard/profile/me`, profileData);
};

export const getWishlist = async () => {
  return api.get(`/dashboard/wishlist`);
};

export const addToWishlist = async (auctionId) => {
  return api.post(`/dashboard/wishlist`, { auctionId });
};

export const removeFromWishlist = async (auctionId) => {
  return api.delete(`/dashboard/wishlist/${auctionId}`);
};

export const getEnrolledAuctions = async () => {
  return api.get(`/dashboard/auctions/enrolled`);
};

export const getWonAuctions = async () => {
  return api.get(`/dashboard/auctions/won`);
};

// --- Other API Calls (example, adjust as needed) ---

// Example for fetching auctions (if not handled by dashboard BFF directly)
export const getAuctions = async () => {
  return api.get(`/dashboard/auctions`); // Assuming dashboard BFF proxies this
};

// --- Auction Details API Calls (proxied through Dashboard BFF) ---

export const getAuctionDetails = async (auctionId) => {
  return api.get(`/dashboard/auctions/${auctionId}`);
};

export const getAuctionBids = async (auctionId) => {
  return api.get(`/dashboard/auctions/${auctionId}/bids`);
};

export const bidOnAuction = async (auctionId, amount) => {
  return api.post(`/dashboard/auctions/${auctionId}/bid`, { amount });
};

export const getUserPublicProfile = async (userId) => {
  return api.get(`/dashboard/users/${userId}/public`);
};

// --- Cart Service API Calls (proxied through Dashboard BFF) ---

export const getMyOrders = async () => {
  return api.get(`/dashboard/orders/my-orders`);
};

export const getOrderById = async (orderId) => {
  return api.get(`/dashboard/orders/${orderId}`);
};

export const createOrder = async (auctionId) => {
  return api.post(`/dashboard/orders`, { auctionId });
};

export const shipOrder = async (orderId, trackingInfo) => {
  return api.post(`/dashboard/orders/${orderId}/ship`, trackingInfo);
};

export const confirmDelivery = async (orderId) => {
  return api.post(`/dashboard/orders/${orderId}/deliver`);
};

// --- Payment Service API Calls (proxied through Dashboard BFF) ---

export const createPaymentOrder = async (amount, orderId) => {
  return api.post(`/dashboard/payments/create-order`, { amount, orderId });
};

export const verifyPayment = async (paymentDetails) => {
  return api.post(`/dashboard/payments/verify`, paymentDetails);
};

// --- Inventory Service API Calls (proxied through Dashboard BFF) ---

export const getProductById = async (productId) => {
  return api.get(`/dashboard/products/${productId}`);
};

export const createProduct = async (productData) => {
  return api.post(`/dashboard/products`, productData);
};

export const updateProduct = async (productId, productData) => {
  return api.put(`/dashboard/products/${productId}`, productData);
};

export const deleteProduct = async (productId) => {
  return api.delete(`/dashboard/products/${productId}`);
};

export const getListedItems = async () => {
  return api.get(`/dashboard/inventory/listed-items`);
};

export const getSoldItems = async () => {
  return api.get(`/dashboard/inventory/sold-items`);
};

// Add other API functions as you create them