import crypto from "crypto";
import config from "../config/config.js";

/**
 * Formats a payment document into the Razorpay order response format expected by client checkout.
 */
export const toRazorpayOrderResponse = (payment) => ({
  id: payment.razorpayOrderId,
  amount: payment.amount,
  currency: "INR",
});

/**
 * Calculates Buyer's Protection Fee: 5% + 100 INR
 */
export const calculateProtectionFee = (baseAmount) => {
  const protectionFee = baseAmount * 0.05 + 100;
  const totalAmount = baseAmount + protectionFee;
  const amountInPaise = Math.round(totalAmount * 100);

  return {
    protectionFee,
    totalAmount,
    amountInPaise,
  };
};

/**
 * Verifies the HMAC SHA256 signature returned from Razorpay checkout.
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
};

/**
 * Verifies Razorpay webhook signature against the raw body buffer.
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!config.RAZORPAY_WEBHOOK_SECRET || !signature || !rawBody) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
};

