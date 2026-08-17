import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findByIdMock = jest.fn();
const bidFindOneMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    findById: findByIdMock,
  },
}));

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {
    findOne: bidFindOneMock,
  },
}));

const { endAuction, cancelAuction } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("endAuction & cancelAuction", () => {
  let req, res;
  const auctionId = new mongoose.Types.ObjectId().toHexString();
  const sellerId = new mongoose.Types.ObjectId().toHexString();
  const otherUserId = new mongoose.Types.ObjectId().toHexString();

  const baseAuction = {
    _id: auctionId,
    sellerId: sellerId,
    startAuctionAt: new Date(Date.now() - 100000),
    auctionDuration: 1,
    auctionDurationUnit: "days",
    bids: [],
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { auctionId },
      user: { id: sellerId },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("endAuction", () => {
    it("should end an auction successfully", async () => {
      findByIdMock.mockResolvedValue(baseAuction);
      bidFindOneMock.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          bidderId: "winner123",
          _id: "winbid123",
        }),
      })

      await endAuction(req, res);

      expect(findByIdMock).toHaveBeenCalledWith(auctionId);
      expect(baseAuction.save).toHaveBeenCalled();
      expect(baseAuction.endAuctionAt).toBeInstanceOf(Date);
      expect(baseAuction.winnerId).toBe("winner123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Auction ended successfully and winner declared." })
      );
    });

    it("should return 403 if user is not the seller", async () => {
      req.user.id = otherUserId;
      findByIdMock.mockResolvedValue(baseAuction);

      await endAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You are not authorized to end this auction.",
      });
    });

    it("should return 400 if auction is already ended", async () => {
      const endedAuction = { ...baseAuction, endAuctionAt: new Date(), cancelledAt: null };
      findByIdMock.mockResolvedValue(endedAuction);

      await endAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Auction has already ended." });
    });

    it("should return 400 if auction is already cancelled", async () => {
      const cancelledAuction = { ...baseAuction, endAuctionAt: null, cancelledAt: new Date() };
      findByIdMock.mockResolvedValue(cancelledAuction);
      await endAuction(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Auction has already cancelled." });
    });
  });

  describe("cancelAuction", () => {
    it("should cancel an auction successfully if no bids exist", async () => {
      const auctionWithNoBids = { ...baseAuction, bids: [] };
      findByIdMock.mockResolvedValue(auctionWithNoBids);

      await cancelAuction(req, res);

      expect(auctionWithNoBids.save).toHaveBeenCalled();
      expect(auctionWithNoBids.cancelledAt).toBeInstanceOf(Date);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Auction cancelled successfully." })
      );
    });

    it("should return 400 if trying to cancel an auction with bids", async () => {
      const auctionWithBids = { ...baseAuction, bids: ["bid1"] };
      findByIdMock.mockResolvedValue(auctionWithBids);

      await cancelAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cannot cancel an auction that has active bids.",
      });
    });

    it("should return 403 if user is not the seller", async () => {
      req.user.id = otherUserId;
      findByIdMock.mockResolvedValue(baseAuction);

      await cancelAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You are not authorized to cancel this auction.",
      });
    });

    it("should return 404 if auction not found", async () => {
      findByIdMock.mockResolvedValue(null);

      await cancelAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Auction not found." });
    });
  });
});