import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    auctionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    snapshot: {
      title: { type: String, default: "" },
      images: { type: Array, default: [] },
      image: { type: String, default: "" },
      currentBid: { type: Number, default: 0 },
      startingBid: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      status: { type: String, default: "" },
      startAuctionAt: { type: Date },
      endAuctionAt: { type: Date },
    },
  },
  { timestamps: true },
);

wishlistItemSchema.index({ userId: 1, auctionId: 1 }, { unique: true });

const wishlistModel = mongoose.model("WishlistItem", wishlistItemSchema);
export default wishlistModel;

