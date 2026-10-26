import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import auctionModel from "../models/auction.model.js";
import bidModel from "../models/bid.model.js";
import config from "../config/config.js";
import { AUCTION_DURATION_UNITS } from "../constants/auction.constants.js";
import { getCache, setCache } from "../cache/redis.js";
import {
  ensureMinAuctionDuration,
  isValidDurationUnit,
  getAuctionEndTime,
  getAuctionStatus,
  toAuctionResponse,
} from "../utils/auction.utils.js";

/**
 * Triggers automatic order creation in the Cart service for a won auction.
 */
export const triggerAutoCreateOrder = (auction, retries = 5, initialDelay = 2000) => {
  if (!config.CART_SERVICE_URL || !config.INTERNAL_AUTH_TOKEN_SECRET) {
    console.error("Missing config for internal cart service call.");
    return;
  }

  const url = new URL("/api/orders/internal/auto-create", config.CART_SERVICE_URL);

  const attempt = async (currentRetry, delay) => {
    try {
      const internalToken = jwt.sign(
        { service: "features-service" },
        config.INTERNAL_AUTH_TOKEN_SECRET,
        { expiresIn: "5m" },
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${internalToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auctionId: auction._id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      auction.orderCreatedAt = new Date();
      await auction.save();

      console.log(`Order auto-created successfully for auction ${auction._id}`);
    } catch (err) {
      if (currentRetry > 0) {
        console.warn(
          `Failed to auto-create order for auction ${auction._id}. Retrying in ${delay}ms... (${currentRetry} retries left). Error: ${err.message}`,
        );
        const retryTimer = setTimeout(() => attempt(currentRetry - 1, delay * 2), delay);
        retryTimer.unref?.();
      } else {
        console.error(`CRITICAL: Exhausted all retries for auto-creating order for auction ${auction._id}. Error:`, err);
      }
    }
  };

  attempt(retries, initialDelay);
};

/**
 * Transitions auction state (live events, resolving winners, setting deleteAt, and publish events).
 */
export const processAuctionTransitions = async (auction) => {
  const endAuctionAtTime = getAuctionEndTime(auction).getTime();
  const currentStatus = getAuctionStatus(auction);
  let shouldSave = false;

  if (currentStatus === "live" && !auction.isLiveEventPublished) {
    auction.isLiveEventPublished = true;
    shouldSave = true;
    import("../broker/rabbit.js")
      .then(({ publishToQueue }) => {
        publishToQueue("auction_live", {
          sellerId: auction.sellerId.toString(),
          title: auction.title,
          startingPrice: auction.startingPrice,
        });
      })
      .catch((err) => console.error("Could not import publishToQueue", err));
  }

  if (currentStatus === "ended" && !auction.cancelledAt) {
    let winnerResolutionPending = false;
    if (!auction.winnerId) {
      const latestAuction = await auction.constructor
        .findById(auction._id)
        .select("winnerId winningBidId currentPrice bids")
        .lean();

      if (latestAuction?.winnerId) {
        auction.winnerId = latestAuction.winnerId;
        auction.winningBidId = latestAuction.winningBidId;
        auction.currentPrice = latestAuction.currentPrice;
      } else if (latestAuction?.bids?.length) {
        winnerResolutionPending = true;
        const acceptedBidIds = latestAuction.bids;
        const winningBid = await bidModel
          .findOne({
            _id: { $in: acceptedBidIds },
            auctionId: auction._id,
            amount: latestAuction.currentPrice,
          })
          .sort({ createdAt: -1 });

        if (winningBid) {
          const atomicallyUpdatedAuction = await auction.constructor.findOneAndUpdate(
            {
              _id: auction._id,
              $or: [{ winnerId: { $exists: false } }, { winnerId: null }],
              currentPrice: latestAuction.currentPrice,
              bids: winningBid._id,
            },
            {
              $set: {
                winnerId: winningBid.bidderId,
                winningBidId: winningBid._id,
              },
            },
            { new: true },
          );

          if (atomicallyUpdatedAuction) {
            auction.winnerId = atomicallyUpdatedAuction.winnerId;
            auction.winningBidId = atomicallyUpdatedAuction.winningBidId;
            winnerResolutionPending = false;

            triggerAutoCreateOrder(atomicallyUpdatedAuction);

            import("../broker/rabbit.js")
              .then(({ publishToQueue }) => {
                publishToQueue("auction_won", {
                  auctionId: atomicallyUpdatedAuction._id.toString(),
                  winnerId: atomicallyUpdatedAuction.winnerId.toString(),
                  price: atomicallyUpdatedAuction.currentPrice,
                });
              })
              .catch((err) => console.error("Could not import publishToQueue", err));
          }
        }
      }
    }

    if (!winnerResolutionPending && !auction.deleteAt) {
      auction.deleteAt = new Date(endAuctionAtTime + 48 * 60 * 60 * 1000);
      shouldSave = true;
    }

    if (!winnerResolutionPending && !auction.isEndedEventPublished) {
      auction.isEndedEventPublished = true;
      shouldSave = true;
      import("../broker/rabbit.js")
        .then(({ publishToQueue }) => {
          publishToQueue("auction_ended", {
            sellerId: auction.sellerId.toString(),
            title: auction.title,
            currentPrice: auction.currentPrice,
            winnerId: auction.winnerId ? auction.winnerId.toString() : null,
          });
        })
        .catch((err) => console.error("Could not import publishToQueue", err));
    }
  }

  if (shouldSave) {
    await auction.save();
  }

  return auction;
};

/**
 * Creates a new auction linked to a product.
 */
export const createAuction = async (body) => {
  const existingAuction = await auctionModel.findOne({ productId: body.productId });
  if (existingAuction) {
    return {
      isExisting: true,
      auction: await toAuctionResponse(existingAuction),
    };
  }

  if (!isValidDurationUnit(body.auctionDurationUnit)) {
    const error = new Error(`Auction duration unit must be one of: ${AUCTION_DURATION_UNITS.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }

  ensureMinAuctionDuration(body.auctionDuration, body.auctionDurationUnit);

  const reviewEndsAtDate = new Date(body.reviewEndsAt);
  const startAuctionAtDate = new Date(body.startAuctionAt);
  const now = new Date();

  if (isNaN(reviewEndsAtDate.getTime()) || isNaN(startAuctionAtDate.getTime())) {
    const error = new Error("Invalid date format for reviewEndsAt or startAuctionAt.");
    error.statusCode = 400;
    throw error;
  }

  if (reviewEndsAtDate <= now) {
    const error = new Error("Review end time must be in the future.");
    error.statusCode = 400;
    throw error;
  }

  if (startAuctionAtDate < reviewEndsAtDate) {
    const error = new Error("Auction start time must be at or after the review period ends.");
    error.statusCode = 400;
    throw error;
  }

  const auction = await auctionModel.create({
    productId: body.productId,
    sellerId: body.sellerId,
    title: body.title,
    description: body.description,
    category: body.category,
    startingPrice: Number(body.startingPrice),
    currentPrice: Number(body.startingPrice),
    reviewEndsAt: body.reviewEndsAt,
    startAuctionAt: body.startAuctionAt,
    auctionDuration: Number(body.auctionDuration),
    auctionDurationUnit: body.auctionDurationUnit,
    size: body.size,
    sizeUnit: body.sizeUnit,
    weight: body.weight,
    weightUnit: body.weightUnit,
    brand: body.brand,
    condition: body.condition,
    color: body.color,
    material: body.material,
    images: body.images || [],
  });

  return {
    isExisting: false,
    auction: await toAuctionResponse(auction),
  };
};

/**
 * Fetches all active auctions, cached in Redis for 15s.
 */
export const getAuctions = async () => {
  const cachedAuctions = await getCache("all_auctions");
  if (cachedAuctions) {
    return { cached: true, auctions: cachedAuctions };
  }

  const now = new Date();
  const auctions = await auctionModel
    .find({
      $and: [
        { cancelledAt: null },
        {
          $or: [{ deleteAt: null }, { deleteAt: { $gt: now } }],
        },
      ],
    })
    .sort({ createdAt: -1 });

  const processedAuctions = await Promise.all(auctions.map(toAuctionResponse));
  await setCache("all_auctions", processedAuctions, 15);

  return { cached: false, auctions: processedAuctions };
};

/**
 * Fetches a single auction by ID, resolving any pending transitions on-demand.
 */
export const getAuctionById = async (auctionId) => {
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    const error = new Error("Invalid auction ID format.");
    error.statusCode = 400;
    throw error;
  }

  let auction = await auctionModel.findById(auctionId);
  if (!auction) {
    const error = new Error("Auction not found");
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = getAuctionStatus(auction);
  if (
    currentStatus === "ended" &&
    !auction.cancelledAt &&
    ((!auction.winnerId && Array.isArray(auction.bids) && auction.bids.length > 0) || !auction.deleteAt)
  ) {
    auction = await processAuctionTransitions(auction);
  }

  return toAuctionResponse(auction);
};

/**
 * Updates an auction's listing details.
 */
export const updateAuction = async (auctionId, body) => {
  const auction = await auctionModel.findById(auctionId);
  if (!auction) {
    const error = new Error("Auction not found");
    error.statusCode = 404;
    throw error;
  }

  const nextDuration = body.auctionDuration ?? auction.auctionDuration;
  const nextUnit = body.auctionDurationUnit ?? auction.auctionDurationUnit;
  if (!isValidDurationUnit(nextUnit)) {
    const error = new Error(`Auction duration unit must be one of: ${AUCTION_DURATION_UNITS.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }
  ensureMinAuctionDuration(nextDuration, nextUnit);

  const nextReviewEndsAt = new Date(body.reviewEndsAt ?? auction.reviewEndsAt);
  const nextStartAuctionAt = new Date(body.startAuctionAt ?? auction.startAuctionAt);
  const now = new Date();

  if (isNaN(nextReviewEndsAt.getTime()) || isNaN(nextStartAuctionAt.getTime())) {
    const error = new Error("Invalid date format for reviewEndsAt or startAuctionAt.");
    error.statusCode = 400;
    throw error;
  }

  if (body.reviewEndsAt !== undefined && nextReviewEndsAt <= now) {
    const error = new Error("Review end time must be in the future.");
    error.statusCode = 400;
    throw error;
  }

  if (nextStartAuctionAt < nextReviewEndsAt) {
    const error = new Error("Auction start time must be at or after the review period ends.");
    error.statusCode = 400;
    throw error;
  }

  const editableFields = {
    title: body.title,
    description: body.description,
    category: body.category,
    reviewEndsAt: body.reviewEndsAt,
    startAuctionAt: body.startAuctionAt,
    size: body.size,
    sizeUnit: body.sizeUnit,
    weight: body.weight,
    weightUnit: body.weightUnit,
    brand: body.brand,
    condition: body.condition,
    color: body.color,
    material: body.material,
    images: body.images,
  };

  for (const [key, value] of Object.entries(editableFields)) {
    if (value !== undefined) auction[key] = value;
  }

  if (body.startingPrice !== undefined) {
    auction.startingPrice = Number(body.startingPrice);
    auction.currentPrice = Number(body.startingPrice);
  }

  if (body.auctionDuration !== undefined) {
    auction.auctionDuration = Number(body.auctionDuration);
  }
  if (body.auctionDurationUnit !== undefined) {
    auction.auctionDurationUnit = body.auctionDurationUnit;
  }

  const updatedAuction = await auction.save();
  return toAuctionResponse(updatedAuction);
};

/**
 * Deletes an auction by ID.
 */
export const deleteAuction = async (auctionId) => {
  const auction = await auctionModel.findByIdAndDelete(auctionId);
  if (!auction) {
    const error = new Error("Auction not found");
    error.statusCode = 404;
    throw error;
  }
  return true;
};

/**
 * Finalizes an auction that has reached its scheduled end time.
 */
export const endAuction = async (auctionId, sellerId) => {
  if (!sellerId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
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

  if (auction.sellerId.toString() !== sellerId) {
    const error = new Error("You are not authorized to end this auction.");
    error.statusCode = 403;
    throw error;
  }

  const auctionStatus = getAuctionStatus(auction);
  if (auctionStatus !== "ended") {
    const error = new Error(
      auctionStatus === "cancelled"
        ? "A cancelled auction cannot be ended."
        : "An auction cannot be ended before its scheduled end time.",
    );
    error.statusCode = 400;
    throw error;
  }

  await processAuctionTransitions(auction);
  return toAuctionResponse(auction);
};

/**
 * Cancels an auction that has no active bids.
 */
export const cancelAuction = async (auctionId, sellerId) => {
  if (!sellerId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
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

  if (auction.sellerId.toString() !== sellerId) {
    const error = new Error("You are not authorized to cancel this auction.");
    error.statusCode = 403;
    throw error;
  }

  if (auction.bids && auction.bids.length > 0) {
    const error = new Error("Cannot cancel an auction that has active bids.");
    error.statusCode = 400;
    throw error;
  }

  auction.cancelledAt = new Date();
  await auction.save();
  return toAuctionResponse(auction);
};

/**
 * Fetches all distinct auctions enrolled/bid on by the user.
 */
export const getEnrolledAuctionsByUser = async (userId) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const auctionIds = await bidModel.distinct("auctionId", { bidderId: userId });
  if (!auctionIds || auctionIds.length === 0) {
    return [];
  }

  const auctions = await auctionModel.find({ _id: { $in: auctionIds } }).sort({ createdAt: -1 });
  return Promise.all(auctions.map(toAuctionResponse));
};

/**
 * Fetches all won auctions for the user.
 */
export const getWonAuctionsByUser = async (userId) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const auctions = await auctionModel.find({ winnerId: userId }).sort({ createdAt: -1 });
  if (!auctions || auctions.length === 0) {
    return [];
  }

  return Promise.all(auctions.map(toAuctionResponse));
};

/**
 * Retries creating orders for any won auctions missing an orderCreatedAt timestamp.
 */
export const processUnresolvedOrders = async () => {
  const unresolvedAuctions = await auctionModel.find({
    winnerId: { $exists: true, $ne: null },
    orderCreatedAt: null,
  });

  for (const auction of unresolvedAuctions) {
    triggerAutoCreateOrder(auction, 1, 0);
  }
  return unresolvedAuctions.length;
};

