import { jest } from "@jest/globals";
import mongoose from "mongoose";

const auctionFindMock = jest.fn();
const bidDistinctMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    find: auctionFindMock,
  },
}));

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {
    distinct: bidDistinctMock,
  },
}));

const { getEnrolledAuctionsByUser, getWonAuctionsByUser } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("User-specific auction queries", () => {
  let req, res;
  const userId = new mongoose.Types.ObjectId().toHexString();
  const auctionId1 = new mongoose.Types.ObjectId().toHexString();
  const auctionId2 = new mongoose.Types.ObjectId().toHexString();

  const mockAuction = {
    _id: auctionId1,
    title: "Test Auction",
    startAuctionAt: new Date(),
    auctionDuration: 1,
    auctionDurationUnit: "days",
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { id: userId } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getEnrolledAuctionsByUser", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = null;
      await getEnrolledAuctionsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return enrolled auctions for a user", async () => {
      const auctionIds = [auctionId1, auctionId2];
      bidDistinctMock.mockResolvedValue(auctionIds);
      auctionFindMock.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockAuction, { ...mockAuction, _id: auctionId2 }]),
      });

      await getEnrolledAuctionsByUser(req, res);

      expect(bidDistinctMock).toHaveBeenCalledWith("auctionId", { bidderId: userId });
      expect(auctionFindMock).toHaveBeenCalledWith({ _id: { $in: auctionIds } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Enrolled auctions fetched successfully.",
          auctions: expect.any(Array),
        })
      );
      expect(res.json.mock.calls[0][0].auctions.length).toBe(2);
    });

    it("should return an empty array if no enrolled auctions are found", async () => {
      bidDistinctMock.mockResolvedValue([]);

      await getEnrolledAuctionsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "No enrolled auctions found.",
        auctions: [],
      });
    });
  });

  describe("getWonAuctionsByUser", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = null;
      await getWonAuctionsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return won auctions for a user", async () => {
      auctionFindMock.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockAuction]),
      });

      await getWonAuctionsByUser(req, res);

      expect(auctionFindMock).toHaveBeenCalledWith({ winnerId: userId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Won auctions fetched successfully.",
          auctions: expect.any(Array),
        })
      );
      expect(res.json.mock.calls[0][0].auctions.length).toBe(1);
    });

    it("should return an empty array if no won auctions are found", async () => {
      auctionFindMock.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await getWonAuctionsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "No won auctions found.",
        auctions: [],
      });
    });
  });
});