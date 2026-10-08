import mongoose from "mongoose";
import auctionModel from "../models/auction.model.js";
import bidModel from "../models/bid.model.js";
import "../models/user.model.js";
import { createOrderForAuction } from "../services/cart.service.js";
import config from "../config/config.js";
import { AUCTION_DURATION_UNITS } from "../constants/auction.constants.js";
import jwt from "jsonwebtoken";
import { getCache, setCache, clearCache, setNxCache } from "../cache/redis.js";


const triggerAutoCreateOrder = (auction, retries = 5, initialDelay = 2000) => {
  if (!config.CART_SERVICE_URL || !config.INTERNAL_AUTH_TOKEN_SECRET) {
    console.error("Missing config for internal cart service call.");
    return;
  }

  const url = new URL('/api/orders/internal/auto-create', config.CART_SERVICE_URL);

  const attempt = async (currentRetry, delay) => {
    try {
      const internalToken = jwt.sign(
        { service: 'features-service' },
        config.INTERNAL_AUTH_TOKEN_SECRET,
        { expiresIn: '5m' }
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${internalToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auctionId: auction._id })
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
        console.warn(`Failed to auto-create order for auction ${auction._id}. Retrying in ${delay}ms... (${currentRetry} retries left). Error: ${err.message}`);
        const retryTimer = setTimeout(() => attempt(currentRetry - 1, delay * 2), delay);
        retryTimer.unref?.();
      } else {
        console.error(`CRITICAL: Exhausted all retries for auto-creating order for auction ${auction._id}. Error:`, err);
      }
    }
  };

  attempt(retries, initialDelay);
};

const MIN_AUCTION_DURATION_MS = (config.MIN_AUCTION_DURATION_MINUTES || 5) * 60 * 1000;
const toDurationMs = (duration, unit = "days") => {
  const parsedDuration = Number(duration || 0);
  switch (unit) {
    case "minutes":
      return parsedDuration * 60 * 1000;
    case "hours":
      return parsedDuration * 60 * 60 * 1000;
    default: // days
      return parsedDuration * 24 * 60 * 60 * 1000;
  }
};

const ensureMinAuctionDuration = (duration, unit) => {
  if (toDurationMs(duration, unit) < MIN_AUCTION_DURATION_MS) {
    const error = new Error(`Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.`);
    error.statusCode = 400;
    throw error;
  }
};

const isValidDurationUnit = (unit) => AUCTION_DURATION_UNITS.includes(unit);

const getAuctionEndTime = (auction) => {
  if (auction.endAuctionAt) return new Date(auction.endAuctionAt); // If manually ended
  const durationInMs = toDurationMs(auction.auctionDuration, auction.auctionDurationUnit);
  return new Date(new Date(auction.startAuctionAt).getTime() + durationInMs);
};

export const getAuctionStatus = (auction, now = Date.now()) => { // Exported for potential external use/testing
  if (auction.cancelledAt) return "cancelled";
  if (auction.endAuctionAt && now >= new Date(auction.endAuctionAt).getTime()) {
    return "ended";
  }

  const startAuctionAtTime = new Date(auction.startAuctionAt).getTime();
  const endAuctionAtTime = getAuctionEndTime(auction).getTime();

  if (now >= endAuctionAtTime) return "ended";
  if (now >= startAuctionAtTime) return "live";
  return "upcoming";
};

export const processAuctionTransitions = async (auction) => {
  const endAuctionAtTime = getAuctionEndTime(auction).getTime();
  const currentStatus = getAuctionStatus(auction);
  let shouldSave = false;

  if (currentStatus === "live" && !auction.isLiveEventPublished) {
    auction.isLiveEventPublished = true;
    shouldSave = true;
    import('../broker/rabbit.js').then(({ publishToQueue }) => {
      publishToQueue('auction_live', {
        sellerId: auction.sellerId.toString(),
        title: auction.title,
        startingPrice: auction.startingPrice
      });
    }).catch(err => console.error("Could not import publishToQueue", err));
  }

  if (currentStatus === "ended" && !auction.cancelledAt) {
    if (!auction.deleteAt) {
      auction.deleteAt = new Date(endAuctionAtTime + 48 * 60 * 60 * 1000); // Hide after 48 hours
      shouldSave = true;
    }

    if (!auction.winnerId) {
      const winningBid = await bidModel.findOne({ auctionId: auction._id }).sort({ createdAt: -1 });

      if (winningBid) {
        const atomicallyUpdatedAuction = await auction.constructor.findOneAndUpdate(
          { _id: auction._id, winnerId: { $exists: false } },
          {
            $set: {
              winnerId: winningBid.bidderId,
              winningBidId: winningBid._id
            }
          },
          { new: true }
        );

        if (atomicallyUpdatedAuction) {
          auction.winnerId = atomicallyUpdatedAuction.winnerId;
          auction.winningBidId = atomicallyUpdatedAuction.winningBidId;

          triggerAutoCreateOrder(atomicallyUpdatedAuction);

          import('../broker/rabbit.js').then(({ publishToQueue }) => {
            publishToQueue('auction_won', {
              auctionId: atomicallyUpdatedAuction._id.toString(),
              winnerId: atomicallyUpdatedAuction.winnerId.toString(),
              price: atomicallyUpdatedAuction.currentPrice
            });
          }).catch(err => console.error("Could not import publishToQueue", err));
        }
      }
    }

    if (!auction.isEndedEventPublished) {
      auction.isEndedEventPublished = true;
      shouldSave = true;
      import('../broker/rabbit.js').then(({ publishToQueue }) => {
        publishToQueue('auction_ended', {
          sellerId: auction.sellerId.toString(),
          title: auction.title,
          currentPrice: auction.currentPrice,
          winnerId: auction.winnerId ? auction.winnerId.toString() : null
        });
      }).catch(err => console.error("Could not import publishToQueue", err));
    }
  }

  if (shouldSave) {
    await auction.save();
  }

  return auction;
};

export const toAuctionResponse = async (auction) => {
  const endAuctionAtTime = getAuctionEndTime(auction).getTime();
  const currentStatus = getAuctionStatus(auction);
  const response = {
    ...auction.toObject(),
    status: currentStatus,
    endAuctionAt: new Date(endAuctionAtTime),
  };

  // This private mapping is used internally to assign stable public labels.
  // Never expose bidder ObjectIds through the public auction response.
  delete response.uniqueBidders;
  return response;
};

export const createAuction = async (req, res) => {
  try {
    console.log('Features Service: Received request to create auction for productId:', req.body.productId);
    const existingAuction = await auctionModel.findOne({ productId: req.body.productId });

    if (existingAuction) {
      return res.status(200).json({
        message: "Auction already exists for product",
        // Ensure toAuctionResponse is called to potentially update deleteAt
        auction: await toAuctionResponse(existingAuction),
        isExisting: true, // Add a flag to indicate it's an existing auction
      });
    }

    if (!isValidDurationUnit(req.body.auctionDurationUnit)) {
      return res.status(400).json({ message: `Auction duration unit must be one of: ${AUCTION_DURATION_UNITS.join(", ")}.` });
    }

    ensureMinAuctionDuration(req.body.auctionDuration, req.body.auctionDurationUnit);

    const reviewEndsAtDate = new Date(req.body.reviewEndsAt);
    const startAuctionAtDate = new Date(req.body.startAuctionAt);
    const now = new Date();

    if (isNaN(reviewEndsAtDate.getTime()) || isNaN(startAuctionAtDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format for reviewEndsAt or startAuctionAt." });
    }

    if (reviewEndsAtDate <= now) {
      return res.status(400).json({ message: "Review end time must be in the future." });
    }

    if (startAuctionAtDate < reviewEndsAtDate) {
      return res.status(400).json({ message: "Auction start time must be at or after the review period ends." });
    }

    const auction = await auctionModel.create({
      productId: req.body.productId,
      sellerId: req.body.sellerId,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      startingPrice: Number(req.body.startingPrice),
      currentPrice: Number(req.body.startingPrice),
      reviewEndsAt: req.body.reviewEndsAt,
      startAuctionAt: req.body.startAuctionAt,
      auctionDuration: Number(req.body.auctionDuration),
      auctionDurationUnit: req.body.auctionDurationUnit,
      size: req.body.size,
      sizeUnit: req.body.sizeUnit,
      weight: req.body.weight,
      weightUnit: req.body.weightUnit,
      brand: req.body.brand,
      condition: req.body.condition,
      color: req.body.color,
      material: req.body.material,
      images: req.body.images || [],
      // deleteAt will be null by default, and set later when it ends
    });

    const responseAuction = await toAuctionResponse(auction); // Ensure toAuctionResponse is called for new auctions too
    res.status(201).json({ message: "Auction created successfully", auction: responseAuction });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create auction",
    });
  }
};

export const getAuctions = async (_req, res) => {
  try {
    const cachedAuctions = await getCache('all_auctions');
    if (cachedAuctions) {
      return res.status(200).json({
        message: "Auctions fetched successfully (cached)",
        auctions: cachedAuctions,
      });
    }

    const now = new Date();

    // Only return auctions that are NOT cancelled, and
    // whose hide time (deleteAt) is either not set yet or is still in the future.
    const auctions = await auctionModel.find({
      $and: [
        { cancelledAt: null },
        {
          $or: [
            { deleteAt: null },
            { deleteAt: { $gt: now } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    const processedAuctions = await Promise.all(auctions.map(toAuctionResponse));

    // Cache the response for 15 seconds
    await setCache('all_auctions', processedAuctions, 15);

    // Use Promise.all to ensure all toAuctionResponse calls (and potential saves) complete
    res.status(200).json({
      message: "Auctions fetched successfully",
      auctions: processedAuctions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch auctions",
    });
  }
};

export const getAuctionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format." });
    }

    // Note: Do not populate `sellerId`/`winnerId` here.
    // In this architecture the user model/data may live in a different service/DB,
    // and populating would resolve to `null` and break the UI.
    const auction = await auctionModel.findById(req.params.auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    const responseAuction = await toAuctionResponse(auction);

    res.status(200).json({ message: "Auction fetched successfully", auction: responseAuction });
  } catch (error) {
    console.error("Error fetching auction by ID:", error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: `Invalid auction ID: ${req.params.auctionId}` });
    }
    res.status(500).json({
      message: "Failed to fetch auction due to a server error.",
    });
  }
};

export const auctionBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    let { amount } = req.body;
    const bidderId = req.user?.id;

    if (!bidderId) {
      return res.status(401).json({ message: "Unauthorized. Please log in to bid." });
    }

    amount = Number(amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Bid amount must be a positive number." });
    }

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format." });
    }

    const auction = await auctionModel.findById(auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }

    const auctionStatus = getAuctionStatus(auction);
    if (auctionStatus !== "live") {
      return res.status(400).json({ message: `Auction is not live. Current status: ${auctionStatus}` });
    }

    if (auction.sellerId.toString() === bidderId) {
      return res.status(403).json({ message: "You cannot bid on your own auction." });
    }

    if (amount <= auction.currentPrice) {
      return res.status(400).json({ message: `Your bid must be higher than the current price of Rs.${auction.currentPrice}.` });
    }

    if (amount % 10 !== 0) {
      return res.status(400).json({ message: "Bid amount must be in multiples of 10." });
    }

    // Older auctions predate uniqueBidders. Backfill their bidders from bid
    // history once so labels continue after the existing bidders.
    if ((!Array.isArray(auction.uniqueBidders) || auction.uniqueBidders.length === 0)
      && Array.isArray(auction.bids) && auction.bids.length > 0) {
      const historicalBids = await bidModel.find({ auctionId })
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
            $or: [
              { uniqueBidders: { $exists: false } },
              { uniqueBidders: { $size: 0 } },
            ],
          },
          { $set: { uniqueBidders: historicalBidders } },
          { new: true },
        );

        if (migratedAuction) {
          auction.uniqueBidders = migratedAuction.uniqueBidders;
        } else {
          // Another bid request may have completed the same migration first.
          const currentAuction = await auctionModel.findById(auctionId).select("uniqueBidders");
          auction.uniqueBidders = currentAuction?.uniqueBidders || [];
        }
      }
    }

    // Rate limiting: allow only one bid per minute per user, atomically
    const rateLimitKey = `rate_limit:bid:${bidderId}`;
    const lockAcquired = await setNxCache(rateLimitKey, true, 60);

    if (!lockAcquired) {
      // Fallback to checking DB if Redis isn't active/working or if genuinely limited
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentBid = await bidModel.findOne({
        bidderId,
        createdAt: { $gte: oneMinuteAgo }
      });

      if (recentBid) {
        const waitSeconds = Math.ceil((recentBid.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000);
        return res.status(429).json({
          message: `You are bidding too fast! Please wait ${waitSeconds} seconds before placing another bid.`
        });
      }
    }

    // Pre-generate the bid ID
    const bidId = new mongoose.Types.ObjectId();

    // 1. Create the bid document first to guarantee persistence before altering auction price
    const newBid = new bidModel({
      _id: bidId,
      auctionId,
      bidderId,
      amount,
    });
    await newBid.save(); // Wait for bid to be written

    // 2. Atomically update the auction ONLY IF currentPrice is still less than amount.
    //    Append a bidder only once. $concatArrays makes the numbering order explicit;
    //    $addToSet does not guarantee array order.
    const bidderObjectId = new mongoose.Types.ObjectId(bidderId);
    const updatedAuction = await auctionModel.findOneAndUpdate(
      {
        _id: auctionId,
        currentPrice: { $lt: amount }
      },
      [{
        $set: {
          currentPrice: { $literal: amount },
          bids: {
            $concatArrays: [
              { $ifNull: ["$bids", []] },
              [{ $literal: bidId }],
            ],
          },
          uniqueBidders: {
            $let: {
              vars: { existing: { $ifNull: ["$uniqueBidders", []] } },
              in: {
                $cond: [
                  { $in: [{ $literal: bidderObjectId }, "$$existing"] },
                  "$$existing",
                  {
                    $concatArrays: [
                      "$$existing",
                      [{ $literal: bidderObjectId }],
                    ],
                  },
                ],
              },
            },
          },
        },
      }],
      { new: true }
    );

    if (!updatedAuction) {
      // 3. Update failed due to race condition (price increased), rollback the bid
      await bidModel.findByIdAndDelete(bidId);
      const currentAuction = await auctionModel.findById(auctionId);
      return res.status(400).json({
        message: `Bid rejected. The current price has increased to Rs.${currentAuction?.currentPrice || auction.currentPrice}.`
      });
    }

    // Emit a real-time event to all clients in the auction room.
    // The bidder label is derived from uniqueBidders (returned by the atomic update above)
    // — no second DB query needed, labels are stable and persisted.
    const io = req.app.get('io');
    if (io) {
      const bidderIdStr = String(bidderId);
      const bidderIndex = updatedAuction.uniqueBidders.findIndex(
        (id) => String(id) === bidderIdStr
      );
      // findIndex returns -1 only if something went very wrong; fall back gracefully.
      const bidderLabel = bidderIndex >= 0
        ? `Bidder ${bidderIndex + 1}`
        : `Bidder ?`;

      io.to(auctionId).emit('new_bid', {
        auctionId,
        currentPrice: updatedAuction.currentPrice,
        bid: {
          amount: newBid.amount,
          createdAt: newBid.createdAt,
          bidderLabel,
        },
      });
    }

    // Publish auction_join event to rabbitmq
    import('../broker/rabbit.js').then(({ publishToQueue }) => {
      publishToQueue('auction_join', {
        auctionId,
        bidderId,
        amount
      });
    }).catch(err => console.error("Could not import publishToQueue", err));

    res.status(201).json({ message: "Bid placed successfully.", bid: newBid });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ message: "Failed to place bid." });
  }
};

export const getBidsForAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format." });
    }

    // Fetch bids in chronological order so legacy auctions without uniqueBidders
    // can still show the right bidder labels.
    const [auction, chronologicalBids] = await Promise.all([
      auctionModel.findById(auctionId).select("uniqueBidders").lean(),
      bidModel.find({ auctionId }).sort({ createdAt: 1, _id: 1 }),
    ]);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }

    // Prefer the persisted ordering, backfilling labels from chronological bid
    // history for auctions created before uniqueBidders was introduced.
    const bidderOrder = Array.isArray(auction.uniqueBidders) && auction.uniqueBidders.length > 0
      ? auction.uniqueBidders
      : chronologicalBids.reduce((ordered, bid) => {
        const id = String(bid.bidderId);
        if (!ordered.some((knownId) => String(knownId) === id)) ordered.push(bid.bidderId);
        return ordered;
      }, []);
    const labelMap = new Map(
      bidderOrder.map((id, i) => [String(id), `Bidder ${i + 1}`])
    );

    const publicBids = chronologicalBids.map((bid) => ({
      _id: bid._id,
      auctionId: bid.auctionId,
      amount: bid.amount,
      createdAt: bid.createdAt,
      bidderLabel: labelMap.get(String(bid.bidderId)) ?? "Bidder ?",
    })).reverse();

    res.status(200).json({ message: "Bids fetched successfully.", bids: publicBids });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ message: "Failed to fetch bids." });
  }
};

export const endAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format." });
    }

    const auction = await auctionModel.findById(auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }

    if (auction.sellerId.toString() !== sellerId) {
      return res.status(403).json({ message: "You are not authorized to end this auction." });
    }

    const auctionStatus = getAuctionStatus(auction);
    if (auctionStatus === 'ended' || auctionStatus === 'cancelled') {
      return res.status(400).json({ message: `Auction has already ${auctionStatus}.` });
    }

    // Manually end the auction by setting its end time to now
    auction.endAuctionAt = new Date();
    await auction.save();

    // Immediately process state transitions (winner assignment, event publishing, order creation)
    await processAuctionTransitions(auction);

    const responseAuction = await toAuctionResponse(auction);
    res.status(200).json({ message: "Auction ended successfully and winner declared.", auction: responseAuction });

  } catch (error) {
    console.error("Error ending auction:", error);
    res.status(500).json({ message: "Failed to end auction." });
  }
};

export const cancelAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format." });
    }

    const auction = await auctionModel.findById(auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }

    if (auction.sellerId.toString() !== sellerId) {
      return res.status(403).json({ message: "You are not authorized to cancel this auction." });
    }

    if (auction.bids && auction.bids.length > 0) {
      return res.status(400).json({ message: "Cannot cancel an auction that has active bids." });
    }

    auction.cancelledAt = new Date();
    await auction.save();

    const responseAuction = await toAuctionResponse(auction);
    res.status(200).json({ message: "Auction cancelled successfully.", auction: responseAuction });

  } catch (error) {
    console.error("Error cancelling auction:", error);
    res.status(500).json({ message: "Failed to cancel auction." });
  }
};

export const updateAuction = async (req, res) => {
  try {
    const auction = await auctionModel.findById(req.params.auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    const nextDuration = req.body.auctionDuration ?? auction.auctionDuration;
    const nextUnit = req.body.auctionDurationUnit ?? auction.auctionDurationUnit;
    if (!isValidDurationUnit(nextUnit)) {
      return res.status(400).json({ message: `Auction duration unit must be one of: ${AUCTION_DURATION_UNITS.join(", ")}.` });
    }
    ensureMinAuctionDuration(nextDuration, nextUnit);

    const nextReviewEndsAt = new Date(req.body.reviewEndsAt ?? auction.reviewEndsAt);
    const nextStartAuctionAt = new Date(req.body.startAuctionAt ?? auction.startAuctionAt);
    const now = new Date();

    if (isNaN(nextReviewEndsAt.getTime()) || isNaN(nextStartAuctionAt.getTime())) {
      return res.status(400).json({ message: "Invalid date format for reviewEndsAt or startAuctionAt." });
    }

    if (req.body.reviewEndsAt !== undefined && nextReviewEndsAt <= now) {
      return res.status(400).json({ message: "Review end time must be in the future." });
    }

    if (nextStartAuctionAt < nextReviewEndsAt) {
      return res.status(400).json({ message: "Auction start time must be at or after the review period ends." });
    }

    const {
      title,
      description,
      category,
      startingPrice,
      reviewEndsAt,
      startAuctionAt,
      auctionDuration,
      auctionDurationUnit,
      size,
      sizeUnit,
      weight,
      weightUnit,
      brand,
      condition,
      color,
      material,
      images,
    } = req.body;

    // Only listing fields may be changed. Ownership, winner, cancellation,
    // bid history, and payment/order state are never client-editable.
    const editableFields = {
      title,
      description,
      category,
      reviewEndsAt,
      startAuctionAt,
      size,
      sizeUnit,
      weight,
      weightUnit,
      brand,
      condition,
      color,
      material,
      images,
    };
    for (const [key, value] of Object.entries(editableFields)) {
      if (value !== undefined) auction[key] = value;
    }

    if (startingPrice !== undefined) {
      auction.startingPrice = Number(startingPrice);
      auction.currentPrice = Number(startingPrice);
    }

    if (auctionDuration !== undefined) {
      auction.auctionDuration = Number(auctionDuration);
    }
    if (auctionDurationUnit !== undefined) {
      auction.auctionDurationUnit = auctionDurationUnit;
    }

    const updatedAuction = await auction.save();

    const responseAuction = await toAuctionResponse(updatedAuction); // Ensure toAuctionResponse is called
    res.status(200).json({ message: "Auction updated successfully", auction: responseAuction });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update auction",
    });
  }
};

export const deleteAuction = async (req, res) => {
  try {
    const auction = await auctionModel.findByIdAndDelete(req.params.auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Respond with 204 No Content for successful deletion
    res.status(204).send();
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete auction",
    });
  }
};

export const getEnrolledAuctionsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    // Find all distinct auction IDs the user has bid on
    const auctionIds = await bidModel.distinct("auctionId", { bidderId: userId });

    if (!auctionIds || auctionIds.length === 0) {
      return res.status(200).json({ message: "No enrolled auctions found.", auctions: [] });
    }

    // Fetch all auctions corresponding to these IDs
    const auctions = await auctionModel.find({ _id: { $in: auctionIds } }).sort({ createdAt: -1 });

    // Process auctions to get current status etc.
    const responseAuctions = await Promise.all(auctions.map(toAuctionResponse));

    res.status(200).json({
      message: "Enrolled auctions fetched successfully.",
      auctions: responseAuctions,
    });
  } catch (error) {
    console.error("Error fetching enrolled auctions:", error);
    res.status(500).json({
      message: "Failed to fetch enrolled auctions.",
    });
  }
};

export const getWonAuctionsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    // Find all auctions where the user is the winner
    const auctions = await auctionModel.find({ winnerId: userId }).sort({ createdAt: -1 });

    if (!auctions || auctions.length === 0) {
      return res.status(200).json({ message: "No won auctions found.", auctions: [] });
    }

    // Process auctions to get current status etc.
    const responseAuctions = await Promise.all(auctions.map(toAuctionResponse));

    res.status(200).json({
      message: "Won auctions fetched successfully.",
      auctions: responseAuctions,
    });
  } catch (error) {
    console.error("Error fetching won auctions:", error);
    res.status(500).json({ message: "Failed to fetch won auctions." });
  }
};

export const processUnresolvedOrders = async () => {
  const unresolvedAuctions = await auctionModel.find({
    winnerId: { $exists: true, $ne: null },
    orderCreatedAt: null
  });

  for (const auction of unresolvedAuctions) {
    triggerAutoCreateOrder(auction, 1, 0); // Trigger a single retry immediately
  }
  return unresolvedAuctions.length;
};

export const retryUnresolvedOrderCreation = async (req, res) => {
  try {
    const count = await processUnresolvedOrders();
    res.status(200).json({
      message: `Triggered order creation retry for ${count} unresolved auctions.`,
      count
    });
  } catch (error) {
    console.error("Error retrying unresolved orders:", error);
    res.status(500).json({ message: "Failed to retry unresolved orders." });
  }
};
