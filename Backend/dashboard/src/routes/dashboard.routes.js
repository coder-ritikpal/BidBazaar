import express from "express";
import {
  health, // Import health for a simple test route
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getEnrolledAuctions,
  getWonAuctions,
  getListedItems,
  getAuctionByIdBFF,
  getAuctionBidsBFF,
  bidOnAuctionBFF,
  getSoldItems,
  getProfile,
  getMyOrders,
  createOrder,
  getOrderByIdBFF,
  confirmDeliveryBFF,
  shipOrder,
  createPaymentOrder,
  verifyPayment,
  updateProfile,
  getAllAuctions,
  registerUserBFF,
  loginUserBFF,
  googleAuthBFF,
  googleAuthCallbackBFF,
  logoutUserBFF,
  getProductByIdBFF, // Import the new controller function
  createProductBFF,
  updateProductBFF,
  deleteProductBFF,
  getUserPublicProfileBFF,
} from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js"; // Import the upload middleware

const router = express.Router();

// Wishlist routes (native to dashboard service)
router.get("/wishlist", authMiddleware, getWishlist);
router.post("/wishlist", authMiddleware, addToWishlist);
router.delete("/wishlist/:auctionId", authMiddleware, removeFromWishlist);

// --- Proxy Routes (BFF Pattern) ---

// Auctions Service
router.get("/auctions", getAllAuctions); // Public
router.get("/auctions/enrolled", authMiddleware, getEnrolledAuctions); // Requires authentication
router.get("/auctions/won", authMiddleware, getWonAuctions);         // Requires authentication
router.get("/auctions/:auctionId", getAuctionByIdBFF); // Public
router.get("/auctions/:auctionId/bids", getAuctionBidsBFF); // Public
router.post("/auctions/:auctionId/bid", authMiddleware, bidOnAuctionBFF); // Requires authentication

// Inventory Service
router.get("/inventory/listed-items", authMiddleware, getListedItems); // Requires authentication
router.get("/inventory/sold-items", authMiddleware, getSoldItems);     // Requires authentication
router.get("/products/:productId", authMiddleware, getProductByIdBFF); // New route for fetching product by ID

// Product creation route with multer error handling
router.post("/products", authMiddleware, (req, res, next) => {
  upload.array("images", 2)(req, res, (err) => {
    if (err) {
      console.error("[Dashboard BFF] Multer error for /products:", err.message);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, createProductBFF);

router.put("/products/:productId", authMiddleware, (req, res, next) => {
  upload.array("images", 2)(req, res, (err) => {
    if (err) {
      console.error("[Dashboard BFF] Multer error for /products/:productId:", err.message);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, updateProductBFF);

router.delete("/products/:productId", authMiddleware, deleteProductBFF);

// Auth Service (via BFF)
router.get("/profile/me", authMiddleware, getProfile);               // Requires authentication
router.put("/profile/me", authMiddleware, updateProfile);             // Requires authentication
router.post("/auth/register", registerUserBFF); // No authMiddleware needed for registration
router.post("/auth/login", loginUserBFF);     // No authMiddleware needed for login
router.post("/auth/logout", authMiddleware, logoutUserBFF); // Logout requires a valid token to clear it
router.get("/auth/google", googleAuthBFF);
router.get("/auth/google/callback", googleAuthCallbackBFF); // No authMiddleware, this is the callback
router.get("/users/:userId/public", getUserPublicProfileBFF); // Public user profile

// Health check route
router.get("/health", health);

// Cart Service
router.get("/orders/my-orders", authMiddleware, getMyOrders);
router.get("/orders/:orderId", authMiddleware, getOrderByIdBFF);
router.post("/orders", authMiddleware, createOrder);
router.post("/orders/:orderId/ship", authMiddleware, shipOrder);
router.post("/orders/:orderId/deliver", authMiddleware, confirmDeliveryBFF);

// Payment Service
router.post("/payments/create-order", authMiddleware, createPaymentOrder);
router.post("/payments/verify", authMiddleware, verifyPayment);

export default router;