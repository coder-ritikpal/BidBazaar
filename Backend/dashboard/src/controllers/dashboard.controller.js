import config from "../config/config.js";
import * as wishlistService from "../services/wishlist.service.js";
import {
  toPublicError,
  forwardRequest,
  forwardPublicRequest,
  forwardMultipartRequest,
} from "../utils/proxy.utils.js";

// Re-exports for test suites or legacy imports
export {
  toPublicError,
  forwardRequest,
  forwardPublicRequest,
  forwardMultipartRequest,
};

export const health = async (_req, res) => {
  return res.status(200).json({ ok: true, service: "dashboard" });
};

// --- Wishlist Handlers (Native to Dashboard) ---

export const getWishlist = async (req, res) => {
  const userId = req.user?.id;
  try {
    const wishlist = await wishlistService.getWishlist(userId);
    return res.status(200).json({ message: "Wishlist fetched successfully.", wishlist });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to fetch wishlist." });
  }
};

export const addToWishlist = async (req, res) => {
  const userId = req.user?.id;
  const { auctionId } = req.body || {};

  try {
    const result = await wishlistService.addToWishlist({
      userId,
      auctionId,
    });

    if (result.isDuplicate) {
      return res.status(200).json({ message: "Item already in wishlist" });
    }

    return res.status(201).json({
      message: "Added to wishlist.",
      item: result.item,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to add to wishlist." });
  }
};

export const removeFromWishlist = async (req, res) => {
  const userId = req.user?.id;
  const { auctionId } = req.params || {};

  try {
    await wishlistService.removeFromWishlist({ userId, auctionId });
    return res.status(200).json({ message: "Removed from wishlist." });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to remove from wishlist." });
  }
};

// --- Auctions Service Proxies ---

export const getAllAuctions = async (req, res) => {
  try {
    const url = new URL("/api/auctions", config.AUCTIONS_SERVICE_URL);
    for (const [key, value] of Object.entries(req.query || {})) {
      url.searchParams.set(key, value);
    }
    const data = await forwardPublicRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getEnrolledAuctions = async (req, res) => {
  try {
    const url = new URL("/api/auctions/enrolled/by-user", config.AUCTIONS_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getWonAuctions = async (req, res) => {
  try {
    const url = new URL("/api/auctions/won/by-user", config.AUCTIONS_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getAuctionByIdBFF = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const url = new URL(`/api/auctions/${auctionId}`, config.AUCTIONS_SERVICE_URL);
    const data = await forwardPublicRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getAuctionBidsBFF = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const url = new URL(`/api/auctions/${auctionId}/bids`, config.AUCTIONS_SERVICE_URL);
    for (const [key, value] of Object.entries(req.query || {})) {
      url.searchParams.set(key, value);
    }
    const data = await forwardPublicRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const bidOnAuctionBFF = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const url = new URL(`/api/auctions/${auctionId}/bid`, config.AUCTIONS_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(201).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

// --- Inventory Service Proxies ---

export const getListedItems = async (req, res) => {
  try {
    const url = new URL("/api/products/seller", config.INVENTORY_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getProductByIdBFF = async (req, res) => {
  try {
    const { productId } = req.params;
    const url = new URL(`/api/products/${productId}`, config.INVENTORY_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in getProductByIdBFF:", error);
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const createProductBFF = async (req, res) => {
  try {
    const url = new URL("/api/products", config.INVENTORY_SERVICE_URL);
    const data = await forwardMultipartRequest(req, url);
    return res.status(201).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in createProductBFF:", error);
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const updateProductBFF = async (req, res) => {
  try {
    const { productId } = req.params;
    const url = new URL(`/api/products/${productId}`, config.INVENTORY_SERVICE_URL);
    const data = await forwardMultipartRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in updateProductBFF:", error);
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const deleteProductBFF = async (req, res) => {
  try {
    const { productId } = req.params;
    const url = new URL(`/api/products/${productId}`, config.INVENTORY_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in deleteProductBFF:", error);
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

// --- Cart Service Proxies ---

export const getSoldItems = async (req, res) => {
  try {
    const url = new URL("/api/orders/sold", config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const url = new URL("/api/orders/my-orders", config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const createOrder = async (req, res) => {
  try {
    const url = new URL("/api/orders", config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(201).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = new URL(`/api/orders/${orderId}/ship`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getOrderByIdBFF = async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = new URL(`/api/orders/${orderId}`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const confirmDeliveryBFF = async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = new URL(`/api/orders/${orderId}/deliver`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

// --- Payment Service Proxies ---

export const createPaymentOrder = async (req, res) => {
  try {
    const url = new URL("/api/payments/create-order", config.PAYMENT_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const url = new URL("/api/payments/verify", config.PAYMENT_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

// --- Auth Service Proxies ---

export const registerUserBFF = async (req, res) => {
  try {
    const url = new URL("/api/auth/register", config.AUTH_SERVICE_URL);
    const authResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await authResponse.json();

    if (!authResponse.ok) {
      const error = new Error(data.message || "Registration failed.");
      error.data = data;
      error.statusCode = authResponse.status;
      throw error;
    }

    return res.status(201).json({ message: data.message, user: data.user, token: data.token });
  } catch (error) {
    console.error("Error during registration via BFF:", error);
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const loginUserBFF = async (req, res) => {
  try {
    const url = new URL("/api/auth/login", config.AUTH_SERVICE_URL);
    const authResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await authResponse.json();

    if (!authResponse.ok) {
      const error = new Error(data.message || "Login failed.");
      error.data = data;
      error.statusCode = authResponse.status;
      throw error;
    }

    return res.status(200).json({ message: data.message, user: data.user, token: data.token });
  } catch (error) {
    console.error("Error during login via BFF:", error);
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const googleAuthBFF = async (_req, res) => {
  try {
    const url = new URL("/api/auth/google", config.AUTH_SERVICE_URL);
    return res.redirect(url.toString());
  } catch (error) {
    console.error("Error initiating Google OAuth via BFF:", error);
    return res.status(500).json({ message: "Failed to initiate Google OAuth." });
  }
};

export const googleAuthCallbackBFF = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
    }
    return res.redirect(`${config.FRONTEND_URL}?code=${code}&auth_flow=google_login`);
  } catch (error) {
    console.error("Error during Google OAuth callback via BFF:", error);
    return res.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};

export const exchangeGoogleCodeBFF = async (req, res) => {
  try {
    const url = new URL("/api/auth/google/exchange", config.AUTH_SERVICE_URL);
    const authResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await authResponse.json();

    if (!authResponse.ok) {
      return res.status(authResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error exchanging Google code via BFF:", error);
    return res.status(500).json({ message: "Internal server error during token exchange." });
  }
};

export const logoutUserBFF = async (_req, res) => {
  return res.status(200).json({ message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  try {
    const url = new URL("/api/auth/me", config.AUTH_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in getProfile:", error);
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const url = new URL("/api/auth/me", config.AUTH_SERVICE_URL);
    const data = await forwardRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};

export const getUserPublicProfileBFF = async (req, res) => {
  try {
    const { userId } = req.params;
    const url = new URL(`/api/auth/users/${userId}`, config.AUTH_SERVICE_URL);
    const data = await forwardPublicRequest(req, url);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(toPublicError(error));
  }
};
