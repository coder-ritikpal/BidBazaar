import * as paymentService from "../services/payment.service.js";

export const createOrder = async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user?.id;
  const authHeader = req.headers.authorization;

  try {
    const orderResponse = await paymentService.createPaymentOrder({
      orderId,
      userId,
      authHeader,
    });
    return res.status(200).json(orderResponse);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error creating Razorpay order:", error);
    return res.status(error.message === "Order not found." ? 404 : 500).json({
      message: error.message === "Order not found." ? "Order not found." : "Failed to create payment order.",
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = req.body;
  const userId = req.user?.id;

  try {
    await paymentService.verifyPayment({
      internalOrderId: internal_order_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature,
      userId,
    });

    return res.status(200).json({ message: "Payment verified and order updated successfully." });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Internal error during payment verification:", error);
    return res.status(500).json({
      message: "Payment verified, but an internal error occurred while updating your order.",
    });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    await paymentService.handleRazorpayWebhook({
      rawBody: req.rawBody,
      signature,
      event: req.body?.event,
      payload: req.body?.payload,
    });

    return res.status(200).send("OK");
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).send(error.message);
    }
    console.error("Error processing Razorpay webhook:", error);
    return res.status(500).send("Internal Server Error");
  }
};
