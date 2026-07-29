import mongoose from "mongoose";
import { AUCTION_DURATION_UNITS } from "../constants/auction.constants.js";

const auctionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startingPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  bids: [{ type: mongoose.Schema.Types.ObjectId, ref: "bid" }],
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  winningBidId: { type: mongoose.Schema.Types.ObjectId, ref: "bid" },
  images: [{
    url: String,
    thumbnailUrl: String,
    id: String
  }],
  reviewEndsAt: { type: Date, required: true },
  startAuctionAt: { type: Date, required: true },
  auctionDuration: { type: Number, required: true },
  auctionDurationUnit: { type: String, enum: AUCTION_DURATION_UNITS, default: 'days', required: true },
  size: { type: String },
  sizeUnit: { type: String },
  weight: { type: Number },
  weightUnit: { type: String },
  color: { type: String },
  material: { type: String },
  brand: { type: String },
  condition: { type: String },
  cancelledAt: { type: Date, default: null },
  endAuctionAt: { type: Date, default: null }, // To allow manual ending
  orderCreatedAt: { type: Date, default: null },
  deleteAt: { type: Date, default: null },
}, { timestamps: true });

const auctionModel = mongoose.model("auction", auctionSchema);

export default auctionModel;
