import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    // The order ID from the cart service
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // The user who made the payment
    userId: {
      type: String,
      required: true,
    },
    // The ID of the order created on Razorpay's side
    razorpayOrderId: {
      type: String,
      required: true,
    },
    // The ID of the payment on Razorpay's side
    razorpayPaymentId: {
      type: String,
    },
    // The signature from Razorpay to verify the payment
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    // Status of the payment (e.g., 'created', 'captured', 'failed')
    status: {
      type: String,
      required: true,
      default: 'created',
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;