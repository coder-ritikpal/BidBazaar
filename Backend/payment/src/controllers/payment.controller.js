import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js'; // Assuming config file for secrets
import jwt from 'jsonwebtoken';
import Payment from '../models/payment.model.js';
import { doFetch } from '../utils/fetch.js';

const razorpayInstance = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

const fetchOrderFromCartService = async (orderId, authHeader) => {
  if (!config.CART_SERVICE_URL) {
    throw new Error("Internal configuration error: Cart service URL is missing.");
  }
  
  const url = new URL(`/api/orders/${orderId}`, config.CART_SERVICE_URL);
  
  const response = await doFetch(url, {
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Order not found.");
    }
    const errorText = await response.text();
    console.error(`Failed to fetch order ${orderId}: ${response.status} ${response.statusText}`, errorText);
    throw new Error("Failed to fetch order details.");
  }

  const data = await response.json();
  return data.order;
};

export const createOrder = async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user?.id;
  const authHeader = req.headers.authorization;

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required.' });
  }

  try {
    const order = await fetchOrderFromCartService(orderId, authHeader);
    
    if (String(order.winnerId) !== userId) {
      return res.status(403).json({ message: "You are not authorized to pay for this order." });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ message: "Order is not pending payment." });
    }

    const baseAmount = Number(order.amount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      return res.status(400).json({ message: 'Invalid order amount.' });
    }

    // Calculate Buyer's Protection Fee: 5% + 100 INR
    const protectionFee = (baseAmount * 0.05) + 100;
    const totalAmount = baseAmount + protectionFee;

    const options = {
      amount: Math.round(totalAmount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${orderId}`,
      notes: {
        orderId,
        userId,
        baseAmount: String(baseAmount),
        protectionFee: String(protectionFee.toFixed(2)),
        totalAmount: String(totalAmount.toFixed(2)),
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    await Payment.findOneAndUpdate(
      { orderId },
      { 
        userId,
        razorpayOrderId: razorpayOrder.id,
        amount: options.amount,
        status: 'created'
      },
      { upsert: true, new: true }
    );

    res.status(200).json(razorpayOrder);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(error.message === 'Order not found.' ? 404 : 500).json({
      message: error.message === 'Order not found.'
        ? 'Order not found.'
        : 'Failed to create payment order.',
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = req.body;
  const userId = req.user?.id;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Signature is valid. Verify payment mapping and update order status in cart service.
    try {
      if (!internal_order_id) {
        throw new Error("Internal order ID is missing from payment verification.");
      }
      if (!userId) {
        throw new Error("User ID is missing. Cannot update order status.");
      }

      const payment = await Payment.findOne({
        orderId: internal_order_id,
        razorpayOrderId: razorpay_order_id,
        userId: userId
      });

      if (!payment) {
        return res.status(400).json({ message: "Payment validation failed: Order mismatch or tampered request." });
      }

      if (payment.razorpayPaymentId && payment.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(400).json({ message: "Payment validation failed: Order mismatch or tampered request." });
      }

      if (!config.CART_SERVICE_URL || !config.INTERNAL_AUTH_TOKEN_SECRET) {
        console.error("Cart service URL or internal auth secret is not configured for payment service.");
        throw new Error("Internal server configuration error.");
      }

      // Create an internal token to authenticate with the cart service
      const internalToken = jwt.sign({ id: userId, service: 'payment-service' }, config.INTERNAL_AUTH_TOKEN_SECRET, { expiresIn: '5m' });

      const cartServiceUrl = new URL(`/api/orders/${internal_order_id}/pay`, config.CART_SERVICE_URL);

      const cartResponse = await doFetch(cartServiceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${internalToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!cartResponse.ok) {
        const cartData = await cartResponse.json().catch(() => ({ message: 'Failed to parse cart service response.' }));
        console.error('Error updating order status in cart service:', cartData.message);
        return res.status(502).json({
          message: "Payment verified, but failed to update order status. Please contact support.",
        });
      }

      // The cart update is idempotent, so retries can recover if either service
      // temporarily fails. Persist captured status only after the order is paid.
      payment.status = 'captured';
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      await payment.save();

      res.status(200).json({ message: "Payment verified and order updated successfully." });
    } catch (error) {
      console.error('Internal error during payment verification:', error);
      res.status(500).json({ message: "Payment verified, but an internal error occurred while updating your order." });
    }
  } else {
    res.status(400).json({ message: "Invalid payment signature." });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return res.status(500).send('Webhook secret not configured.');
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).send('Signature missing.');
    }

    // Verify signature using rawBody
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid signature.');
    }

    const event = req.body.event;
    
    // We only care about payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      let entity;
      if (event === 'payment.captured') {
        entity = req.body.payload.payment.entity;
      } else {
        entity = req.body.payload.order.entity;
      }

      const internalOrderId = entity.notes?.orderId;
      const userId = entity.notes?.userId;
      const razorpayOrderId = entity.order_id || entity.id;

      if (internalOrderId && userId) {
        // Verify against local payment intent
        const payment = await Payment.findOne({
          orderId: internalOrderId,
          razorpayOrderId: razorpayOrderId
        });

        if (!payment) {
          console.warn(`[Webhook] No matching payment intent for order ${internalOrderId} and razorpay order ${razorpayOrderId}.`);
          return res.status(400).send('Invalid payment mapping.');
        }

        if (payment.status !== 'captured') {
          payment.status = 'captured';
          if (event === 'payment.captured') {
            payment.razorpayPaymentId = entity.id;
          }
          await payment.save();
        }

        // Authenticate as a service to the cart service
        const internalToken = jwt.sign(
          { id: userId, service: 'payment-service-webhook' },
          config.INTERNAL_AUTH_TOKEN_SECRET,
          { expiresIn: '5m' }
        );

        const cartServiceUrl = new URL(`/api/orders/${internalOrderId}/pay`, config.CART_SERVICE_URL);

        const cartResponse = await doFetch(cartServiceUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${internalToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!cartResponse.ok) {
          console.error(`[Webhook] Failed to update order status for order ${internalOrderId} in cart service.`);
          // We can return 500 to tell Razorpay to retry later
          return res.status(500).send('Failed to update cart service.');
        }

        console.log(`[Webhook] Successfully processed ${event} for order ${internalOrderId}.`);
      } else {
        console.warn(`[Webhook] Missing internal orderId or userId in notes for event ${event}.`);
      }
    }

    // Always return 200 OK to Razorpay so it doesn't retry infinitely
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};
