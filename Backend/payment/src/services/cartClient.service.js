import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { doFetch } from "../utils/fetch.js";

/**
 * Fetches order details from the Cart service.
 */
export const fetchOrderFromCartService = async (orderId, authHeader) => {
  if (!config.CART_SERVICE_URL) {
    const error = new Error("Internal configuration error: Cart service URL is missing.");
    error.statusCode = 500;
    throw error;
  }

  const url = new URL(`/api/orders/${orderId}`, config.CART_SERVICE_URL);

  const response = await doFetch(url, {
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      const error = new Error("Order not found.");
      error.statusCode = 404;
      throw error;
    }
    const errorText = await response.text();
    console.error(`Failed to fetch order ${orderId}: ${response.status} ${response.statusText}`, errorText);
    const error = new Error("Failed to fetch order details.");
    error.statusCode = response.status || 500;
    throw error;
  }

  const data = await response.json();
  return data.order;
};

/**
 * Calls the Cart service internal endpoint to mark the order as paid.
 */
export const notifyCartServiceOrderPaid = async ({ internalOrderId, userId, service = "payment-service" }) => {
  if (!config.CART_SERVICE_URL || !config.INTERNAL_AUTH_TOKEN_SECRET) {
    console.error("Cart service URL or internal auth secret is not configured for payment service.");
    const error = new Error("Internal server configuration error.");
    error.statusCode = 500;
    throw error;
  }

  const internalToken = jwt.sign(
    { id: userId, service },
    config.INTERNAL_AUTH_TOKEN_SECRET,
    { expiresIn: "5m" },
  );

  const cartServiceUrl = new URL(`/api/orders/${internalOrderId}/pay`, config.CART_SERVICE_URL);

  const response = await doFetch(cartServiceUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${internalToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const cartData = await response.json().catch(() => ({ message: "Failed to parse cart service response." }));
    console.error("Error updating order status in cart service:", cartData.message);
    const error = new Error("Payment verified, but failed to update order status. Please contact support.");
    error.statusCode = 502;
    throw error;
  }

  return true;
};

