import Razorpay from "razorpay";
import config from "../config/config.js";
import Payment from "../models/payment.model.js";
import {
  toRazorpayOrderResponse,
  calculateProtectionFee,
  verifyRazorpaySignature,
  verifyWebhookSignature,
} from "../utils/payment.utils.js";
import {
  fetchOrderFromCartService,
  notifyCartServiceOrderPaid,
} from "./cartClient.service.js";

const razorpayInstance = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

/**
 * Creates or reuses a Razorpay order for an unpaid cart order.
 */
export const createPaymentOrder = async ({ orderId, userId, authHeader }) => {
  if (!orderId) {
    const error = new Error("Order ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const order = await fetchOrderFromCartService(orderId, authHeader);

  if (String(order.winnerId) !== userId) {
    const error = new Error("You are not authorized to pay for this order.");
    error.statusCode = 403;
    throw error;
  }

  if (order.status !== "pending_payment") {
    const error = new Error("Order is not pending payment.");
    error.statusCode = 400;
    throw error;
  }

  const baseAmount = Number(order.amount);
  if (isNaN(baseAmount) || baseAmount <= 0) {
    const error = new Error("Invalid order amount.");
    error.statusCode = 400;
    throw error;
  }

  // Reuse existing provider order on retries to avoid duplicate checkouts
  const existingPayment = await Payment.findOne({ orderId });
  if (existingPayment) {
    if (existingPayment.userId !== userId) {
      const error = new Error("You are not authorized to pay for this order.");
      error.statusCode = 403;
      throw error;
    }
    if (existingPayment.status === "captured") {
      const error = new Error("Payment was already captured. Refresh your orders.");
      error.statusCode = 409;
      throw error;
    }
    if (existingPayment.status === "created") {
      return toRazorpayOrderResponse(existingPayment);
    }
  }

  const { protectionFee, totalAmount, amountInPaise } = calculateProtectionFee(baseAmount);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_order_${orderId}`,
    notes: {
      orderId,
      userId,
      baseAmount: String(baseAmount),
      protectionFee: String(protectionFee.toFixed(2)),
      totalAmount: String(totalAmount.toFixed(2)),
    },
  };

  const razorpayOrder = await razorpayInstance.orders.create(options);

  try {
    const payment = await Payment.create({
      orderId,
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: options.amount,
      status: "created",
    });
    return toRazorpayOrderResponse(payment);
  } catch (error) {
    if (error?.code !== 11000) throw error;

    const payment = await Payment.findOne({ orderId });
    if (!payment || payment.userId !== userId) throw error;
    if (payment.status === "captured") {
      const conflictError = new Error("Payment was already captured. Refresh your orders.");
      conflictError.statusCode = 409;
      throw conflictError;
    }
    return toRazorpayOrderResponse(payment);
  }
};

/**
 * Validates a client Razorpay checkout signature and updates the order status in the Cart service.
 */
export const verifyPayment = async ({
  internalOrderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  userId,
}) => {
  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    const error = new Error("Invalid payment signature.");
    error.statusCode = 400;
    throw error;
  }

  if (!internalOrderId) {
    const error = new Error("Internal order ID is missing from payment verification.");
    error.statusCode = 400;
    throw error;
  }
  if (!userId) {
    const error = new Error("User ID is missing. Cannot update order status.");
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findOne({
    orderId: internalOrderId,
    razorpayOrderId,
    userId,
  });

  if (!payment || (payment.razorpayPaymentId && payment.razorpayPaymentId !== razorpayPaymentId)) {
    const error = new Error("Payment validation failed: Order mismatch or tampered request.");
    error.statusCode = 400;
    throw error;
  }

  // Mark the order as paid in the Cart service
  await notifyCartServiceOrderPaid({
    internalOrderId,
    userId,
    service: "payment-service",
  });

  // Record captured status on the payment record
  payment.status = "captured";
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  await payment.save();

  return true;
};

/**
 * Handles incoming Razorpay webhooks, verifying the signature and notifying the Cart service.
 */
export const handleRazorpayWebhook = async ({ rawBody, signature, event, payload }) => {
  if (!config.RAZORPAY_WEBHOOK_SECRET) {
    const error = new Error("Webhook secret not configured.");
    error.statusCode = 500;
    throw error;
  }

  if (!signature) {
    const error = new Error("Signature missing.");
    error.statusCode = 400;
    throw error;
  }

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    const error = new Error("Invalid signature.");
    error.statusCode = 400;
    throw error;
  }

  if (event === "payment.captured" || event === "order.paid") {
    let entity;
    if (event === "payment.captured") {
      entity = payload?.payment?.entity;
    } else {
      entity = payload?.order?.entity;
    }

    const internalOrderId = entity?.notes?.orderId;
    const userId = entity?.notes?.userId;
    const razorpayOrderId = entity?.order_id || entity?.id;

    if (internalOrderId && userId) {
      const payment = await Payment.findOne({
        orderId: internalOrderId,
        razorpayOrderId,
      });

      if (!payment) {
        console.warn(`[Webhook] No matching payment intent for order ${internalOrderId} and razorpay order ${razorpayOrderId}.`);
        const error = new Error("Invalid payment mapping.");
        error.statusCode = 400;
        throw error;
      }

      if (payment.status !== "captured") {
        payment.status = "captured";
        if (event === "payment.captured") {
          payment.razorpayPaymentId = entity.id;
        }
        await payment.save();
      }

      await notifyCartServiceOrderPaid({
        internalOrderId,
        userId,
        service: "payment-service-webhook",
      });

      console.log(`[Webhook] Successfully processed ${event} for order ${internalOrderId}.`);
    } else {
      console.warn(`[Webhook] Missing internal orderId or userId in notes for event ${event}.`);
    }
  }

  return true;
};

