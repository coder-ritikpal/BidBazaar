import * as auctionService from "../services/auction.service.js";
import * as bidService from "../services/bid.service.js";
import {
  getAuctionStatus,
  toAuctionResponse,
  formatMaskedBidder,
  maskName,
} from "../utils/auction.utils.js";
import { processAuctionTransitions, processUnresolvedOrders } from "../services/auction.service.js";

// Re-exports for cron and legacy imports
export {
  getAuctionStatus,
  processAuctionTransitions,
  processUnresolvedOrders,
  toAuctionResponse,
  formatMaskedBidder,
  maskName,
};

export const createAuction = async (req, res) => {
  try {
    const result = await auctionService.createAuction(req.body);
    if (result.isExisting) {
      return res.status(200).json({
        message: "Auction already exists for product",
        auction: result.auction,
        isExisting: true,
      });
    }

    return res.status(201).json({
      message: "Auction created successfully",
      auction: result.auction,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(400).json({
      message: "Failed to create auction",
    });
  }
};

export const getAuctions = async (req, res) => {
  try {
    const { cached, auctions, pagination } = await auctionService.getAuctions(req.query);
    return res.status(200).json({
      message: cached ? "Auctions fetched successfully (cached)" : "Auctions fetched successfully",
      auctions,
      pagination,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch auctions",
    });
  }
};

export const getAuctionById = async (req, res) => {
  try {
    const auction = await auctionService.getAuctionById(req.params.auctionId);
    return res.status(200).json({
      message: "Auction fetched successfully",
      auction,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: `Invalid auction ID: ${req.params.auctionId}` });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Failed to fetch auction due to a server error.",
    });
  }
};

export const updateAuction = async (req, res) => {
  try {
    const auction = await auctionService.updateAuction(req.params.auctionId, req.body);
    return res.status(200).json({
      message: "Auction updated successfully",
      auction,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(400).json({
      message: "Failed to update auction",
    });
  }
};

export const deleteAuction = async (req, res) => {
  try {
    await auctionService.deleteAuction(req.params.auctionId);
    return res.status(204).send();
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(400).json({
      message: "Failed to delete auction",
    });
  }
};

export const auctionBid = async (req, res) => {
  try {
    const io = req.app.get("io");
    const newBid = await bidService.placeBid({
      auctionId: req.params.auctionId,
      bidderId: req.user?.id,
      amount: req.body.amount,
      io,
    });

    return res.status(201).json({
      message: "Bid placed successfully.",
      bid: {
        _id: newBid._id,
        auctionId: newBid.auctionId,
        amount: newBid.amount,
        createdAt: newBid.createdAt,
        bidderLabel: "You",
        isSelf: true,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error placing bid:", error);
    return res.status(500).json({ message: "Failed to place bid." });
  }
};

export const getBidsForAuction = async (req, res) => {
  try {
    const viewingUserId = req.user?.id ? String(req.user.id) : null;
    const bids = await bidService.getBidsForAuction({
      auctionId: req.params.auctionId,
      viewingUserId,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      message: "Bids fetched successfully.",
      bids: bids.bids,
      pagination: bids.pagination,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error fetching bids:", error);
    return res.status(500).json({ message: "Failed to fetch bids." });
  }
};

export const endAuction = async (req, res) => {
  try {
    const auction = await auctionService.endAuction(req.params.auctionId, req.user?.id);
    return res.status(200).json({
      message: "Auction finalized successfully.",
      auction,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error ending auction:", error);
    return res.status(500).json({ message: "Failed to end auction." });
  }
};

export const cancelAuction = async (req, res) => {
  try {
    const auction = await auctionService.cancelAuction(req.params.auctionId, req.user?.id);
    return res.status(200).json({
      message: "Auction cancelled successfully.",
      auction,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error cancelling auction:", error);
    return res.status(500).json({ message: "Failed to cancel auction." });
  }
};

export const getEnrolledAuctionsByUser = async (req, res) => {
  try {
    const auctions = await auctionService.getEnrolledAuctionsByUser(req.user?.id);
    const message = auctions.length === 0 ? "No enrolled auctions found." : "Enrolled auctions fetched successfully.";
    return res.status(200).json({ message, auctions });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error fetching enrolled auctions:", error);
    return res.status(500).json({ message: "Failed to fetch enrolled auctions." });
  }
};

export const getWonAuctionsByUser = async (req, res) => {
  try {
    const auctions = await auctionService.getWonAuctionsByUser(req.user?.id);
    const message = auctions.length === 0 ? "No won auctions found." : "Won auctions fetched successfully.";
    return res.status(200).json({ message, auctions });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error fetching won auctions:", error);
    return res.status(500).json({ message: "Failed to fetch won auctions." });
  }
};

export const retryUnresolvedOrderCreation = async (_req, res) => {
  try {
    const count = await auctionService.processUnresolvedOrders();
    return res.status(200).json({
      message: `Triggered order creation retry for ${count} unresolved auctions.`,
      count,
    });
  } catch (error) {
    console.error("Error retrying unresolved orders:", error);
    return res.status(500).json({ message: "Failed to retry unresolved orders." });
  }
};
