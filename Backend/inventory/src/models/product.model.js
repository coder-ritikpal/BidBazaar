import mongoose from "mongoose";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_SIZE_UNITS,
  PRODUCT_DURATION_UNITS,
  PRODUCT_WEIGHT_UNITS,
} from "../constants/product.constants.js";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, enum: PRODUCT_CATEGORIES },
  size: { type: String },
  sizeUnit: { type: String, enum: PRODUCT_SIZE_UNITS },
  weight: { type: Number, required: true },
  weightUnit: { type: String, required: true, enum: PRODUCT_WEIGHT_UNITS },
  color: { type: String, required: true },
  material: { type: String, required: true },
  brand: { type: String },
  condition: { type: String, required: true, enum: PRODUCT_CONDITIONS },
  reviewStatus: {
    type: String,
    enum: ["under_review", "approved"],
    default: "under_review",
  },
  reviewEndsAt: { type: Date, required: true },
  startAuctionAt: { type: Date, required: true },
  auctionDuration: { type: Number, required: true, min: 1 },
  auctionDurationUnit: { type: String, enum: PRODUCT_DURATION_UNITS, default: 'days', required: true },
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: "auction" },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  images: [{
    url: String,
    thumbnailUrl: String,
    id: String
  }]
}, { timestamps: true });

const productModel = mongoose.model("product", productSchema);

export default productModel;
