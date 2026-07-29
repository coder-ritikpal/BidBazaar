import express from "express";
import {
  createAuction,
  getAuctionById,
  getAuctions,
  updateAuction,
  deleteAuction,
  auctionBid,
  getBidsForAuction,
  endAuction,
  cancelAuction,
  getEnrolledAuctionsByUser,
  getWonAuctionsByUser,
} from "../controllers/auction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", createAuction);
router.get("/", getAuctions);
router.get("/enrolled/by-user", authMiddleware, getEnrolledAuctionsByUser);
router.get("/won/by-user", authMiddleware, getWonAuctionsByUser);

// Bidding and management routes
// These should come before the generic /:auctionId route to ensure correct matching
router.post("/:auctionId/bid", authMiddleware, auctionBid);
router.get("/:auctionId/bids", getBidsForAuction);
router.post("/:auctionId/end", authMiddleware, endAuction);
router.post("/:auctionId/cancel", authMiddleware, cancelAuction);

// Generic auction routes
router.get("/:auctionId", getAuctionById);
router.put("/:auctionId", updateAuction);
router.delete("/:auctionId", deleteAuction);

export default router;
