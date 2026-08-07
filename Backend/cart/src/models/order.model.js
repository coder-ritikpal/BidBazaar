import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  auctionId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending_payment',
  },
  itemDetails: {
    title: String,
    image: String,
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  trackingNumber: { type: String },
  shippingProvider: { type: String },
  shippedAt: { type: Date },
}, { timestamps: true });

const orderModel = mongoose.model('Order', orderSchema);
export default orderModel;
