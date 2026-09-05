import wishlistModel from "../models/wishlist.model.js";
import config from "../config/config.js";

const RENDER_COLD_START_DELAYS_MS = [2000, 4000, 8000, 16000, 24000];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const isRenderColdStartResponse = async (response) => {
  if (response.status !== 429 || typeof response.clone !== "function") return false;

  const body = await response.clone().text().catch(() => "");
  return body.trim() === "Too Many Requests";
};

// Free Render instances can return a temporary plain-text 429 while waking.
// Retry only that platform response; do not retry application 429s, which may
// represent an intentional rate limit or a payment already being processed.
const fetchWithColdStartRetry = async (url, options) => {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, options);
    const shouldRetry = await isRenderColdStartResponse(response);

    if (!shouldRetry || attempt === RENDER_COLD_START_DELAYS_MS.length) {
      return response;
    }

    await wait(RENDER_COLD_START_DELAYS_MS[attempt]);
  }
};

const fetchAuctionSnapshot = async (auctionId) => {
  const url = new URL(`/api/auctions/${auctionId}`, config.AUCTIONS_SERVICE_URL);
  const response = await fetchWithColdStartRetry(url, { method: "GET" });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  const auction = data?.auction || data;
  if (!auction) return null;

  return {
    title: auction.title || "",
    images: auction.images || [],
    image: auction.image || auction.images?.[0]?.url || "",
    currentBid: auction.currentBid ?? auction.currentPrice ?? 0,
    startingBid: auction.startingBid ?? auction.price ?? 0,
    price: auction.price ?? 0,
    status: auction.status || "",
    startAuctionAt: auction.startAuctionAt ? new Date(auction.startAuctionAt) : undefined,
    endAuctionAt: auction.endAuctionAt ? new Date(auction.endAuctionAt) : undefined,
  };
};

const forwardPublicRequest = async (req, url) => {
  // For public endpoints, we don't strictly require a token.
  // We still forward it if present, as the downstream service might use it for personalization.
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetchWithColdStartRetry(url, {
    method: req.method,
    headers: headers,
    ...(req.method !== 'GET' && req.method !== 'HEAD' && { body: JSON.stringify(req.body) }),
  });

  let data;
  if (typeof response.text !== "function") {
    // Supports the lightweight fetch mocks used by the unit tests.
    data = await response.json();
  } else {
    const rawBody = await response.text();
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      // Hosting providers may return a plain-text or HTML error page (for
      // example, a rate-limit response) instead of the service JSON contract.
      data = {
        message: `The downstream service returned a non-JSON response (status ${response.status}).`,
        upstreamResponse: rawBody.slice(0, 500),
      };
    }
  }
  if (!response.ok) {
    const targetOrigin = new URL(url).origin;
    const serviceName = targetOrigin === new URL(config.AUTH_SERVICE_URL).origin ? 'Auth' :
                        targetOrigin === new URL(config.AUCTIONS_SERVICE_URL).origin ? 'Auctions' :
                        targetOrigin === new URL(config.INVENTORY_SERVICE_URL).origin ? 'Inventory' :
                        'Downstream';
    const errorMessage = data.message || `Failed to fetch data from ${serviceName} service at ${url}.`;
    console.error(`Error forwarding public request to ${url}: ${errorMessage} (Status: ${response.status})`);
    const error = new Error(errorMessage);
    error.data = data;
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

// This function is for JSON payloads, not multipart/form-data
const forwardRequest = async (req, url) => {
  // For requests coming from the frontend to the dashboard BFF,
  // the token should be in the dashboard's own cookie.
  // Now expecting token in Authorization header from frontend, and forwarding it to downstream services
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const response = await fetchWithColdStartRetry(url, {
    method: req.method,
    headers: {
      "Authorization": `Bearer ${token}`, // Forward the token to downstream services
      "Content-Type": "application/json",
    },
    ...(req.method !== 'GET' && req.method !== 'HEAD' && { body: JSON.stringify(req.body) }),
  });

  let data;
  if (typeof response.text !== "function") {
    // Supports the lightweight fetch mocks used by the unit tests.
    data = await response.json();
  } else {
    const rawBody = await response.text();
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      // Proxies and hosting providers often return an HTML/plain-text error page.
      // Preserve the upstream status while returning a useful API error to clients.
      data = {
        message: `The downstream service returned a non-JSON response (status ${response.status}).`,
        upstreamResponse: rawBody.slice(0, 500),
      };
    }
  }
  if (!response.ok) {
    const targetOrigin = new URL(url).origin;
    const serviceName = targetOrigin === new URL(config.AUTH_SERVICE_URL).origin ? 'Auth' :
                        targetOrigin === new URL(config.AUCTIONS_SERVICE_URL).origin ? 'Auctions' :
                        targetOrigin === new URL(config.INVENTORY_SERVICE_URL).origin ? 'Inventory' : // Added Inventory Service
                        'Downstream';
    const errorMessage = data.message || `Failed to fetch data from ${serviceName} service at ${url}.`;
    console.error(`Error forwarding request to ${url}: ${errorMessage} (Status: ${response.status})`);
    const error = new Error(errorMessage);
    error.data = data;
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

/**
 * Forwards a multipart/form-data request, preserving files and fields.
 * Assumes req.files and req.body have been parsed by multer middleware.
 */
const forwardMultipartRequest = async (req, url) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const formData = new FormData();

  // Append all fields from req.body
  for (const key in req.body) {
    formData.append(key, req.body[key]);
  }

  // Append all files from req.files
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      // Use Blob to correctly represent the file buffer with its mimetype
      formData.append(file.fieldname, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    }
  }

  const response = await fetchWithColdStartRetry(url, {
    method: req.method,
    headers: {
      "Authorization": `Bearer ${token}`,
      // Do NOT set Content-Type header for FormData, fetch will set it automatically with boundary
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({ message: `Failed to parse JSON response from ${url}` }));
  if (!response.ok) {
    const targetOrigin = new URL(url).origin;
    const serviceName = targetOrigin === new URL(config.AUTH_SERVICE_URL).origin ? 'Auth' :
                        targetOrigin === new URL(config.AUCTIONS_SERVICE_URL).origin ? 'Auctions' :
                        targetOrigin === new URL(config.INVENTORY_SERVICE_URL).origin ? 'Inventory' :
                        'Downstream';
    const errorMessage = data.message || `Failed to fetch data from ${serviceName} service at ${url}.`;
    console.error(`Error forwarding multipart request to ${url}: ${errorMessage} (Status: ${response.status})`);
    const error = new Error(errorMessage);
    error.data = data;
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

export const health = async (_req, res) => {
  res.status(200).json({ ok: true, service: "dashboard" });
};

export const getWishlist = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
    const items = await wishlistModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const wishlist = items.map((item) => ({
      _id: String(item.auctionId),
      ...item.snapshot,
    }));

    res.status(200).json({ message: "Wishlist fetched successfully.", wishlist });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wishlist.", error: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  const userId = req.user?.id;
  const { auctionId } = req.body || {};

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  if (!auctionId) {
    return res.status(400).json({ message: "auctionId is required" });
  }

  try {
    const snapshot = await fetchAuctionSnapshot(auctionId);

    if (!snapshot) {
      return res.status(404).json({ message: "Auction to add to wishlist not found." });
    }

    const created = await wishlistModel.create({
      userId,
      auctionId,
      snapshot,
    });

    res.status(201).json({
      message: "Added to wishlist.",
      item: { _id: String(created.auctionId), ...(created.snapshot || {}) },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }
    res.status(500).json({ message: "Failed to add to wishlist.", error: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  const userId = req.user?.id;
  const { auctionId } = req.params || {};

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  if (!auctionId) {
    return res.status(400).json({ message: "auctionId is required" });
  }

  try {
    const deleted = await wishlistModel.findOneAndDelete({ userId, auctionId });
    if (!deleted) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }
    res.status(200).json({ message: "Removed from wishlist." });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove from wishlist.", error: error.message });
  }
};

export const getEnrolledAuctions = async (req, res) => {
  try {
    const url = new URL(`/api/auctions/enrolled/by-user`, config.AUCTIONS_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getAllAuctions = async (req, res) => {
  try {
    const url = new URL(`/api/auctions`, config.AUCTIONS_SERVICE_URL);
    const data = await forwardPublicRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getAuctionByIdBFF = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const url = new URL(`/api/auctions/${auctionId}`, config.AUCTIONS_SERVICE_URL);
    // This can be public, but forward auth if present for personalization (e.g. enrolled status)
    const data = await forwardPublicRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getAuctionBidsBFF = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const url = new URL(`/api/auctions/${auctionId}/bids`, config.AUCTIONS_SERVICE_URL);
    const data = await forwardPublicRequest(req, url); // Bids are public
    res.status(200).json(data);
  } catch (error)  {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const bidOnAuctionBFF = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const url = new URL(`/api/auctions/${auctionId}/bid`, config.AUCTIONS_SERVICE_URL);
    const data = await forwardRequest(req, url); // Bidding requires auth
    res.status(201).json(data);
  } catch (error)  {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getProductByIdBFF = async (req, res) => {
  try {
    const { productId } = req.params;
    const url = new URL(`/api/products/${productId}`, config.INVENTORY_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in getProductByIdBFF:", error);
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const url = new URL(`/api/auth/me`, config.AUTH_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

// Cart Service Proxies
export const getMyOrders = async (req, res) => {
  try {
    const url = new URL(`/api/orders/my-orders`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const url = new URL(`/api/orders`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = new URL(`/api/orders/${orderId}/ship`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getOrderByIdBFF = async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = new URL(`/api/orders/${orderId}`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const confirmDeliveryBFF = async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = new URL(`/api/orders/${orderId}/deliver`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

// Payment Service Proxies
export const createPaymentOrder = async (req, res) => {
  try {
    const url = new URL(`/api/payments/create-order`, config.PAYMENT_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const url = new URL(`/api/payments/verify`, config.PAYMENT_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getWonAuctions = async (req, res) => {
  try {
    const url = new URL(`/api/auctions/won/by-user`, config.AUCTIONS_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getListedItems = async (req, res) => {
  try {
    const url = new URL(`/api/products/seller`, config.INVENTORY_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getSoldItems = async (req, res) => {
  try {
    // This endpoint logically belongs with inventory/seller management
    const url = new URL(`/api/orders/sold`, config.CART_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

// --- Authentication Proxies (handled by Dashboard BFF to manage client-side cookie) ---

export const registerUserBFF = async (req, res) => {
  try {
    const url = new URL(`/api/auth/register`, config.AUTH_SERVICE_URL);
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

    // Token is now returned in the body, frontend will store it in localStorage
    res.status(201).json({ message: data.message, user: data.user, token: data.token }); // Include token
  } catch (error) {
    console.error("Error during registration via BFF:", error);
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const createProductBFF = async (req, res) => {
  try {
    // Assuming the Inventory Service has a POST /api/products endpoint for creating products
    const url = new URL(`/api/products`, config.INVENTORY_SERVICE_URL);
    const data = await forwardMultipartRequest(req, url); // Use the new forwardMultipartRequest
    res.status(201).json(data); // Respond with 201 Created for successful resource creation
  } catch (error) {
    console.error("[Dashboard BFF] Error in createProductBFF:", error);
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};
export const updateProductBFF = async (req, res) => {
  try {
    const { productId } = req.params;
    const url = new URL(`/api/products/${productId}`, config.INVENTORY_SERVICE_URL);
    const data = await forwardMultipartRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in updateProductBFF:", error);
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const deleteProductBFF = async (req, res) => {
  try {
    const { productId } = req.params;
    const url = new URL(`/api/products/${productId}`, config.INVENTORY_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in deleteProductBFF:", error);
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const getUserPublicProfileBFF = async (req, res) => {
  try {
    const { userId } = req.params;
    const url = new URL(`/api/auth/users/${userId}`, config.AUTH_SERVICE_URL);
    const data = await forwardPublicRequest(req, url);
    res.status(200).json(data);
  } catch (error)  {
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const loginUserBFF = async (req, res) => {
  try {
    const url = new URL(`/api/auth/login`, config.AUTH_SERVICE_URL);
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

    // Token is now returned in the body, frontend will store it in localStorage
    res.status(200).json({ message: data.message, user: data.user, token: data.token }); // Include token
  } catch (error) {
    console.error("Error during login via BFF:", error);
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};

export const googleAuthBFF = async (req, res) => {
  try {
    // Redirect to the auth service's Google OAuth endpoint
    const url = new URL(`/api/auth/google`, config.AUTH_SERVICE_URL);
    res.redirect(url.toString());
  } catch (error) {
    console.error("Error initiating Google OAuth via BFF:", error);
    res.status(500).json({ message: "Failed to initiate Google OAuth." });
  }
};

export const googleAuthCallbackBFF = async (req, res) => {
  try {
    const { token, user: userString } = req.query;

    if (!token || !userString) {
      return res.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
    }

    // Token and user are received from auth service. Redirect to frontend with them.

    // Verify the token received from the auth service (optional but good practice)
    //   jwt.verify(token, config.JWT_SECRET);
    // } catch (err) {
    //   console.error("Invalid token received from auth service:", err);
    //   return res.redirect(`${config.FRONTEND_URL}/login?error=invalid_token`);
    // }
    res.redirect(`${config.FRONTEND_URL}?token=${token}&user=${userString}&auth_flow=google_login`);
  } catch (error) {
    console.error("Error during Google OAuth callback via BFF:", error);
    res.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};

export const logoutUserBFF = async (req, res) => {
  // Frontend will clear token from localStorage. No cookie to clear here.
  // await fetch(new URL(`/api/auth/logout`, config.AUTH_SERVICE_URL), { method: "POST" });
  res.status(200).json({ message: "Logged out successfully" });
};


export const getProfile = async (req, res) => {
  try {
    const url = new URL(`/api/auth/me`, config.AUTH_SERVICE_URL);
    const data = await forwardRequest(req, url);
    res.status(200).json(data);
  } catch (error) {
    console.error("[Dashboard BFF] Error in getProfile:", error);
    res.status(error.statusCode || 500).json(error.data || { message: error.message });
  }
};
