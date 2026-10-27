import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auction",
    required: true,
  },
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

bidSchema.index({ auctionId: 1, createdAt: -1, _id: -1 });

const bidModel = mongoose.model("bid", bidSchema);

export default bidModel;
