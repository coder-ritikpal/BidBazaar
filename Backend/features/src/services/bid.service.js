import mongoose from "mongoose";
import { createHmac } from "node:crypto";
import auctionModel from "../models/auction.model.js";
import bidModel from "../models/bid.model.js";
import { publishToQueue } from "../broker/rabbit.js";
import { setNxCache, clearCache } from "../cache/redis.js";
import config from "../config/config.js";
import { getAuctionStatus } from "../utils/auction.utils.js";

const publicBidderLabel = (auctionId, bidderId) => {
  const secret = config.JWT_SECRET || config.INTERNAL_AUTH_TOKEN_SECRET;
  if (!secret) throw new Error("Bidder label secret is not configured.");
  const suffix = createHmac("sha256", secret)
    .update(`${auctionId}:${bidderId}`)
    .digest("hex")
    .slice(0, 7);
  return `Bidder ${suffix}`;
};

/**
 * Places a bid atomically on a live auction, enforces rate limits,
 * updates the auction, emits real-time WebSocket events, and queues notifications.
 */
export const placeBid = async ({ auctionId, bidderId, amount, io }) => {
  if (!bidderId) {
    const error = new Error("Unauthorized. Please log in to bid.");
    error.statusCode = 401;
    throw error;
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const error = new Error("Bid amount must be a positive number.");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    const error = new Error("Invalid auction ID format.");
    error.statusCode = 400;
    throw error;
  }

  const auction = await auctionModel.findById(auctionId);
  if (!auction) {
    const error = new Error("Auction not found.");
    error.statusCode = 404;
    throw error;
  }

  const auctionStatus = getAuctionStatus(auction);
  if (auctionStatus !== "live") {
    const error = new Error(`Auction is not live. Current status: ${auctionStatus}`);
    error.statusCode = 400;
    throw error;
  }

  if (auction.sellerId.toString() === bidderId) {
    const error = new Error("You cannot bid on your own auction.");
    error.statusCode = 403;
    throw error;
  }

  if (numericAmount <= auction.currentPrice) {
    const error = new Error(`Your bid must be higher than the current price of Rs.${auction.currentPrice}.`);
    error.statusCode = 400;
    throw error;
  }

  if (numericAmount % 10 !== 0) {
    const error = new Error("Bid amount must be in multiples of 10.");
    error.statusCode = 400;
    throw error;
  }

  // Prevent highest bidder from bidding against themselves — must wait for someone else to outbid them
  const latestBid = await bidModel.findOne({ auctionId }, null, { sort: { createdAt: -1 } });
  if (latestBid && String(latestBid.bidderId) === String(bidderId)) {
    const error = new Error("You are already the highest bidder. You must wait until another user outbids you.");
    error.statusCode = 400;
    throw error;
  }

  // Backfill uniqueBidders for older auctions if needed
  if (
    (!Array.isArray(auction.uniqueBidders) || auction.uniqueBidders.length === 0) &&
    ((typeof auction.totalBids === "number" && auction.totalBids > 0) ||
      (Array.isArray(auction.bids) && auction.bids.length > 0))
  ) {
    const historicalBids = await bidModel
      .find({ auctionId })
      .sort({ createdAt: 1, _id: 1 })
      .select("bidderId")
      .lean();
    const historicalBidders = [];
    const seenBidders = new Set();

    for (const bid of historicalBids) {
      const id = String(bid.bidderId);
      if (!seenBidders.has(id)) {
        seenBidders.add(id);
        historicalBidders.push(new mongoose.Types.ObjectId(id));
      }
    }

    if (historicalBidders.length > 0) {
      const migratedAuction = await auctionModel.findOneAndUpdate(
        {
          _id: auctionId,
          $or: [{ uniqueBidders: { $exists: false } }, { uniqueBidders: { $size: 0 } }],
        },
        { $set: { uniqueBidders: historicalBidders } },
        { new: true },
      );

      if (migratedAuction) {
        auction.uniqueBidders = migratedAuction.uniqueBidders;
      } else {
        const currentAuction = await auctionModel.findById(auctionId).select("uniqueBidders");
        auction.uniqueBidders = currentAuction?.uniqueBidders || [];
      }
    }
  }

  // Rate limiting: enforce a 30-second cooldown between bids on the same auction by the same user.
  // Even if outbid immediately, the user must wait at least 30 seconds from their previous bid.
  const BID_COOLDOWN_SECONDS = 10;
  const rateLimitKey = `rate_limit:bid:${auctionId}:${bidderId}`;
  const lockAcquired = await setNxCache(rateLimitKey, true, BID_COOLDOWN_SECONDS);

  if (!lockAcquired) {
    const cooldownAgo = new Date(Date.now() - BID_COOLDOWN_SECONDS * 1000);
    const recentBid = await bidModel.findOne(
      {
        auctionId,
        bidderId,
        createdAt: { $gte: cooldownAgo },
      },
      null,
      { sort: { createdAt: -1 } }
    );

    if (recentBid) {
      const waitSeconds = Math.max(1, Math.ceil((recentBid.createdAt.getTime() + BID_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000));
      const error = new Error(`You must wait at least 10 seconds between bids on this auction. Please wait ${waitSeconds}s before placing another bid.`);
      error.statusCode = 429;
      throw error;
    }
  }

  const bidId = new mongoose.Types.ObjectId();
  // 1. Create the bid document
  const newBid = new bidModel({
    _id: bidId,
    auctionId,
    bidderId,
    amount: numericAmount,
  });
  await newBid.save();

  // 2. Atomically update the auction only if currentPrice < numericAmount
  const bidderObjectId = new mongoose.Types.ObjectId(bidderId);
  const effectiveEndTime = {
    $ifNull: [
      "$endAuctionAt",
      {
        $add: [
          "$startAuctionAt",
          {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$auctionDurationUnit", "minutes"] },
                  then: { $multiply: ["$auctionDuration", 60 * 1000] },
                },
                {
                  case: { $eq: ["$auctionDurationUnit", "hours"] },
                  then: { $multiply: ["$auctionDuration", 60 * 60 * 1000] },
                },
              ],
              default: { $multiply: ["$auctionDuration", 24 * 60 * 60 * 1000] },
            },
          },
        ],
      },
    ],
  };

  const updatedAuction = await auctionModel.findOneAndUpdate(
    {
      _id: auctionId,
      currentPrice: { $lt: numericAmount },
      winnerId: { $exists: false },
      cancelledAt: null,
      $expr: {
        $and: [
          { $lte: ["$startAuctionAt", "$$NOW"] },
          { $gt: [effectiveEndTime, "$$NOW"] },
        ],
      },
    },
    {
      $set: { currentPrice: numericAmount },
      $inc: { totalBids: 1 },
      $addToSet: { uniqueBidders: bidderObjectId },
    },
    { new: true },
  );

  if (!updatedAuction) {
    // Release cooldown lock and rollback bid if price increased in race condition
    await clearCache(rateLimitKey);
    await bidModel.findByIdAndDelete(bidId);
    const currentAuction = await auctionModel.findById(auctionId);
    const error = new Error(`Bid rejected. The current price has increased to Rs.${currentAuction?.currentPrice || auction.currentPrice}.`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Emit real-time WebSocket event
  if (io) {
    const bidderLabel = publicBidderLabel(auctionId, bidderId);

    io.to(auctionId).emit("new_bid", {
      auctionId,
      currentPrice: updatedAuction.currentPrice,
      totalBids: updatedAuction.totalBids,
      bid: {
        _id: newBid._id,
        amount: newBid.amount,
        createdAt: newBid.createdAt,
        bidderLabel,
      },
    });
  }

  // 4. Publish event to RabbitMQ
  publishToQueue("auction_join", {
    auctionId,
    bidderId,
    amount: numericAmount,
  }).catch((err) => console.error("Could not publish auction_join to queue", err));

  return newBid;
};

/**
 * Fetches the bid history for an auction with formatted public labels.
 */
export const getBidsForAuction = async ({ auctionId, viewingUserId, page = 1, limit = 50 }) => {
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    const error = new Error("Invalid auction ID format.");
    error.statusCode = 400;
    throw error;
  }

  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  const [auction, bids, total] = await Promise.all([
    auctionModel.findById(auctionId).select("_id").lean(),
    bidModel.find({ auctionId }).sort({ createdAt: -1, _id: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
    bidModel.countDocuments({ auctionId }),
  ]);

  if (!auction) {
    const error = new Error("Auction not found.");
    error.statusCode = 404;
    throw error;
  }

  const publicBids = bids
    .map((bid) => {
      const bidBidderId = String(bid.bidderId);
      const isSelf = viewingUserId ? viewingUserId === bidBidderId : false;
      const displayLabel = isSelf ? "You" : publicBidderLabel(auctionId, bidBidderId);

      return {
        _id: bid._id,
        auctionId: bid.auctionId,
        amount: bid.amount,
        createdAt: bid.createdAt,
        isSelf,
        bidderLabel: displayLabel,
      };
    });

  return {
    bids: publicBids,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

