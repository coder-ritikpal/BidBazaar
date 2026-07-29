import mongoose from "mongoose";
import auctionModel from "../models/auction.model.js";
import bidModel from "../models/bid.model.js";
import "../models/user.model.js";
import { createOrderForAuction } from "../services/cart.service.js";
import config from "../config/config.js";
import { AUCTION_DURATION_UNITS } from "../constants/auction.constants.js";
 
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

const toAuctionResponse = async (auction) => { // Made async to allow await for save()
  const endAuctionAtTime = getAuctionEndTime(auction).getTime();
  const currentStatus = getAuctionStatus(auction);

  if (currentStatus === "ended" && !auction.cancelledAt) {
    let shouldSave = false;

    // Ensure deleteAt is always set for ended auctions (including manual end).
    if (!auction.deleteAt) {
      auction.deleteAt = new Date(endAuctionAtTime + 24 * 60 * 60 * 1000);
      shouldSave = true;
    }

    // If the auction has ended and a winner hasn't been assigned yet, determine winner.
    if (!auction.winnerId) {
      const winningBid = await bidModel.findOne({ auctionId: auction._id }).sort({ createdAt: -1 });

      if (winningBid) {
        auction.winnerId = winningBid.bidderId;
        auction.winningBidId = winningBid._id;
        shouldSave = true;
      }
    }

    if (shouldSave) {
      await auction.save();
    }
  }

  return {
    ...auction.toObject(),
    status: currentStatus,
    endAuctionAt: new Date(endAuctionAtTime),
  };
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
      error: error.message,
    });
  }
};

export const getAuctions = async (_req, res) => {
  try {
    const auctions = await auctionModel.find({}).sort({ createdAt: -1 });

    // Use Promise.all to ensure all toAuctionResponse calls (and potential saves) complete
    res.status(200).json({
      message: "Auctions fetched successfully",
      auctions: await Promise.all(auctions.map(toAuctionResponse)),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch auctions",
      error: error.message,
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
      error: error.message,
    });
  }
};

export const auctionBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    const bidderId = req.user?.id;

    if (!bidderId) {
      return res.status(401).json({ message: "Unauthorized. Please log in to bid." });
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

    const newBid = await bidModel.create({
      auctionId,
      bidderId,
      amount,
    });

    auction.bids.push(newBid._id);
    auction.currentPrice = amount;
    await auction.save();

    // Emit a real-time event to all clients in the auction room
    const io = req.app.get('io');
    if (io) {
      io.to(auctionId).emit('new_bid', {
        auctionId,
        currentPrice: auction.currentPrice,
        bid: newBid,
      });
    }

    res.status(201).json({ message: "Bid placed successfully.", bid: newBid });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ message: "Failed to place bid.", error: error.message });
  }
};

export const getBidsForAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format." });
    }

    const bids = await bidModel.find({ auctionId }).sort({ createdAt: -1 });

    res.status(200).json({ message: "Bids fetched successfully.", bids });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ message: "Failed to fetch bids.", error: error.message });
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

    // Determine winner at end time (latest bid is the highest due to bid rules).
    const winningBid = await bidModel.findOne({ auctionId }).sort({ createdAt: -1 });
    if (winningBid) {
      auction.winnerId = winningBid.bidderId;
      auction.winningBidId = winningBid._id;
    }

    // Manually end the auction by setting its end time to now
    auction.endAuctionAt = new Date();
    
    await auction.save();

    const responseAuction = await toAuctionResponse(auction);
    res.status(200).json({ message: "Auction ended successfully and winner declared.", auction: responseAuction });

  } catch (error) {
    console.error("Error ending auction:", error);
    res.status(500).json({ message: "Failed to end auction.", error: error.message });
  }
};

export const cancelAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
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
    res.status(500).json({ message: "Failed to cancel auction.", error: error.message });
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

    const { startingPrice, ...updateData } = req.body;
    const { auctionDuration, auctionDurationUnit, ...restOfUpdateData } = updateData; // Destructure to handle duration separately

    // Dynamically update fields from the request body
    for (const key in updateData) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        auction[key] = updateData[key];
      }
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
      error: error.message,
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
      error: error.message,
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
      error: error.message,
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
    res.status(500).json({ message: "Failed to fetch won auctions.", error: error.message });
  }
};
