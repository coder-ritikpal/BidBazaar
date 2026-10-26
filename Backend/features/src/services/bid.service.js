import mongoose from "mongoose";
import auctionModel from "../models/auction.model.js";
import bidModel from "../models/bid.model.js";
import { setNxCache } from "../cache/redis.js";
import { getAuctionStatus, formatMaskedBidder } from "../utils/auction.utils.js";

/**
 * Places a bid atomically on a live auction, enforces rate limits,
 * updates the auction, emits real-time WebSocket events, and queues notifications.
 */
export const placeBid = async ({ auctionId, bidderId, amount, rawName, io }) => {
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

  // Prevent highest bidder from bidding against themselves
  const latestBid = await bidModel.findOne({ auctionId }, null, { sort: { createdAt: -1 } });
  if (latestBid && String(latestBid.bidderId) === String(bidderId)) {
    const error = new Error("You are already the highest bidder. You cannot bid against yourself.");
    error.statusCode = 400;
    throw error;
  }

  // Backfill uniqueBidders for older auctions if needed
  if (
    (!Array.isArray(auction.uniqueBidders) || auction.uniqueBidders.length === 0) &&
    Array.isArray(auction.bids) &&
    auction.bids.length > 0
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

  // Rate limiting: allow only one bid per minute per user
  const rateLimitKey = `rate_limit:bid:${bidderId}`;
  const lockAcquired = await setNxCache(rateLimitKey, true, 60);

  if (!lockAcquired) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentBid = await bidModel.findOne({
      bidderId,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentBid) {
      const waitSeconds = Math.ceil((recentBid.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000);
      const error = new Error(`You are bidding too fast! Please wait ${waitSeconds} seconds before placing another bid.`);
      error.statusCode = 429;
      throw error;
    }
  }

  const bidId = new mongoose.Types.ObjectId();
  const maskedBidderName = formatMaskedBidder(rawName);

  // 1. Create the bid document
  const newBid = new bidModel({
    _id: bidId,
    auctionId,
    bidderId,
    bidderName: maskedBidderName,
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
    [
      {
        $set: {
          currentPrice: { $literal: numericAmount },
          bids: {
            $concatArrays: [{ $ifNull: ["$bids", []] }, [{ $literal: bidId }]],
          },
          uniqueBidders: {
            $let: {
              vars: { existing: { $ifNull: ["$uniqueBidders", []] } },
              in: {
                $cond: [
                  { $in: [{ $literal: bidderObjectId }, "$$existing"] },
                  "$$existing",
                  {
                    $concatArrays: ["$$existing", [{ $literal: bidderObjectId }]],
                  },
                ],
              },
            },
          },
        },
      },
    ],
    { new: true, updatePipeline: true },
  );

  if (!updatedAuction) {
    // Rollback bid if price increased in race condition
    await bidModel.findByIdAndDelete(bidId);
    const currentAuction = await auctionModel.findById(auctionId);
    const error = new Error(`Bid rejected. The current price has increased to Rs.${currentAuction?.currentPrice || auction.currentPrice}.`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Emit real-time WebSocket event
  if (io) {
    const bidderIdStr = String(bidderId);
    const bidderIndex = updatedAuction.uniqueBidders.findIndex(
      (id) => String(id) === bidderIdStr,
    );
    const fallbackLabel = bidderIndex >= 0 ? `Bidder ${bidderIndex + 1}` : `Bidder ?`;
    const bidderLabel = maskedBidderName || fallbackLabel;

    io.to(auctionId).emit("new_bid", {
      auctionId,
      currentPrice: updatedAuction.currentPrice,
      bid: {
        _id: newBid._id,
        bidderId: newBid.bidderId,
        amount: newBid.amount,
        createdAt: newBid.createdAt,
        bidderLabel,
      },
    });
  }

  // 4. Publish event to RabbitMQ
  import("../broker/rabbit.js")
    .then(({ publishToQueue }) => {
      publishToQueue("auction_join", {
        auctionId,
        bidderId,
        amount: numericAmount,
      });
    })
    .catch((err) => console.error("Could not import publishToQueue", err));

  return newBid;
};

/**
 * Fetches the bid history for an auction with formatted public labels.
 */
export const getBidsForAuction = async ({ auctionId, viewingUserId }) => {
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    const error = new Error("Invalid auction ID format.");
    error.statusCode = 400;
    throw error;
  }

  const [auction, chronologicalBids] = await Promise.all([
    auctionModel.findById(auctionId).select("uniqueBidders").lean(),
    bidModel.find({ auctionId }).sort({ createdAt: 1, _id: 1 }),
  ]);

  if (!auction) {
    const error = new Error("Auction not found.");
    error.statusCode = 404;
    throw error;
  }

  const bidderOrder =
    Array.isArray(auction.uniqueBidders) && auction.uniqueBidders.length > 0
      ? auction.uniqueBidders
      : chronologicalBids.reduce((ordered, bid) => {
          const id = String(bid.bidderId);
          if (!ordered.some((knownId) => String(knownId) === id)) ordered.push(bid.bidderId);
          return ordered;
        }, []);

  const labelMap = new Map(bidderOrder.map((id, i) => [String(id), `Bidder ${i + 1}`]));

  const publicBids = chronologicalBids
    .map((bid) => {
      const bidBidderId = String(bid.bidderId);
      const isSelf = viewingUserId ? viewingUserId === bidBidderId : false;
      const defaultLabel = labelMap.get(bidBidderId) ?? "Bidder ?";
      const displayLabel = isSelf ? "You" : bid.bidderName || defaultLabel;

      return {
        _id: bid._id,
        auctionId: bid.auctionId,
        bidderId: bid.bidderId,
        amount: bid.amount,
        createdAt: bid.createdAt,
        isSelf,
        bidderLabel: displayLabel,
      };
    })
    .reverse();

  return publicBids;
};

