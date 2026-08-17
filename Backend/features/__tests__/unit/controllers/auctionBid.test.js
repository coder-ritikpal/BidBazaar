import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findByIdMock = jest.fn();
const bidCreateMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    findById: findByIdMock,
  },
}));

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {
    create: bidCreateMock,
  },
}));

const { auctionBid } =
  await import("../../../src/controllers/auction.controller.js");

describe("auctionBid", () => {
  let req, res;
  const auctionId = new mongoose.Types.ObjectId().toHexString();
  const sellerId = new mongoose.Types.ObjectId().toHexString();
  const bidderId = new mongoose.Types.ObjectId().toHexString();

  const mockEmit = jest.fn();
  const mockIo = {
    to: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();

    mockIo.to.mockReturnValue({
      emit: mockEmit,
    });

    req = {
      params: { auctionId },
      body: { amount: 1500 },
      user: { id: bidderId },
      app: {
        get: jest.fn().mockReturnValue(mockIo),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });
  const liveAuction = {
    _id: new mongoose.Types.ObjectId(auctionId),
    sellerId: sellerId,
    currentPrice: 1000,
    startAuctionAt: new Date(Date.now() - 100000),
    auctionDuration: 1,
    auctionDurationUnit: "days",
    bids: [],
    save: jest.fn().mockResolvedValue(this),
  };

  it("should place a bid successfully", async () => {
    const auction = {
      ...liveAuction,
      bids: [],
      save: jest.fn().mockResolvedValue(true),
    };
    findByIdMock.mockResolvedValue(auction);
    bidCreateMock.mockResolvedValue({ _id: "bid123", bidderId, amount: 1500 });

    await auctionBid(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(auctionId);
    expect(bidCreateMock).toHaveBeenCalledWith({
      auctionId,
      bidderId,
      amount: 1500,
    });
    expect(auction.save).toHaveBeenCalled();
    expect(auction.currentPrice).toBe(1500);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Bid placed successfully." }),
    );
  });

  it("should emit a socket event on successful bid", async () => {
    const auction = {
      ...liveAuction,
      bids: [],
      save: jest.fn().mockResolvedValue(true),
    };
    const newBid = {
      _id: "bid123",
      bidderId,
      amount: 1500,
    };
    findByIdMock.mockResolvedValue(auction);
    bidCreateMock.mockResolvedValue(newBid);

    await auctionBid(req, res);

    expect(req.app.get).toHaveBeenCalledWith("io");
    expect(mockIo.to).toHaveBeenCalledWith(auctionId);

    expect(mockEmit).toHaveBeenCalledWith("new_bid", {
      auctionId,
      currentPrice: 1500,
      bid: newBid,
    });
  });

  it("should return 401 if user is not logged in", async () => {
    req.user = null;
    await auctionBid(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized. Please log in to bid.",
    });
  });

  it("should return 404 if auction is not found", async () => {
    findByIdMock.mockResolvedValue(null);
    await auctionBid(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Auction not found." });
  });

  it("should return 400 if auction is not live", async () => {
    const upcomingAuction = {
      ...JSON.parse(JSON.stringify(liveAuction)),
      startAuctionAt: new Date(Date.now() + 100000),
    };
    findByIdMock.mockResolvedValue(upcomingAuction);
    await auctionBid(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Auction is not live. Current status: upcoming",
    });
  });

  it("should return 403 if seller bids on their own auction", async () => {
    req.user.id = sellerId;
    const auction = {
      ...liveAuction,
      sellerId: new mongoose.Types.ObjectId(sellerId),
    };
    findByIdMock.mockResolvedValue(auction);
    await auctionBid(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You cannot bid on your own auction.",
    });
  });

  it("should return 400 if bid amount is not higher than current price", async () => {
    req.body.amount = 1000; // Same as current price
    findByIdMock.mockResolvedValue({ ...liveAuction });
    await auctionBid(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: `Your bid must be higher than the current price of Rs.${liveAuction.currentPrice}.`,
    });
  });

  it("should return 400 if bid amount is not a multiple of 10", async () => {
    req.body.amount = 1505;
    findByIdMock.mockResolvedValue({ ...liveAuction });
    await auctionBid(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Bid amount must be in multiples of 10.",
    });
  });

  it("should return 500 on database error", async () => {
    findByIdMock.mockRejectedValue(new Error("DB Error"));
    await auctionBid(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to place bid.",
      error: "DB Error",
    });
  });
});
