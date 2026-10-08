import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findByIdMock = jest.fn();
const findOneAndUpdateMock = jest.fn();
const bidFindOneMock = jest.fn();
const bidFindMock = jest.fn();
const bidFindSortMock = jest.fn();
const bidFindSelectMock = jest.fn();
const bidFindLeanMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    findById: findByIdMock,
    findOneAndUpdate: findOneAndUpdateMock,
  },
}));

const bidSaveMock = jest.fn();
const bidModelMock = jest.fn().mockImplementation((bid) => ({
  ...bid,
  save: bidSaveMock,
}));
jest.unstable_mockModule("../../../src/models/bid.model.js", () => {
  bidModelMock.findOne = bidFindOneMock;
  bidModelMock.find = bidFindMock;
  bidModelMock.findByIdAndDelete = jest.fn();
  return { default: bidModelMock };
});

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
    bidModelMock.mockImplementation((bid) => ({
      ...bid,
      save: bidSaveMock,
    }));
    bidFindMock.mockReturnValue({ sort: bidFindSortMock });
    bidFindSortMock.mockReturnValue({ select: bidFindSelectMock });
    bidFindSelectMock.mockReturnValue({ lean: bidFindLeanMock });

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
    };
    findByIdMock.mockResolvedValue(auction);
    bidFindOneMock.mockResolvedValue(null);
    bidSaveMock.mockResolvedValue(true);
    findOneAndUpdateMock.mockResolvedValue({
      ...auction,
      currentPrice: 1500,
      uniqueBidders: [bidderId],
    });
    await auctionBid(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(auctionId);
    expect(bidFindOneMock).toHaveBeenCalled();
    const [filter, updatePipeline, options] = findOneAndUpdateMock.mock.calls[0];
    expect(filter).toEqual({ _id: auctionId, currentPrice: { $lt: 1500 } });
    expect(Array.isArray(updatePipeline)).toBe(true);
    expect(updatePipeline[0].$set.currentPrice).toEqual({ $literal: 1500 });
    expect(updatePipeline[0].$set.bids.$concatArrays[1][0].$literal)
      .toBeInstanceOf(mongoose.Types.ObjectId);
    expect(updatePipeline[0].$set.uniqueBidders.$let.in.$cond[0].$in[0].$literal)
      .toEqual(new mongoose.Types.ObjectId(bidderId));
    expect(options).toEqual({ new: true });
    expect(bidModelMock).toHaveBeenCalledWith(expect.objectContaining({
      auctionId,
      bidderId,
      amount: 1500,
    }));
    expect(bidSaveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Bid placed successfully." })
    );
  });

  it("should emit a socket event on successful bid", async () => {
    const auction = {
      ...liveAuction,
      bids: [],
    };
    const newBid = {
      _id: "bid123",
      bidderId,
      amount: 1500,
    };
    findByIdMock.mockResolvedValue(auction);
    bidFindOneMock.mockResolvedValue(null);
    bidSaveMock.mockResolvedValue(true);
    findOneAndUpdateMock.mockResolvedValue({
      ...auction,
      currentPrice: 1500,
      uniqueBidders: [bidderId],
    });
    await auctionBid(req, res);

    expect(req.app.get).toHaveBeenCalledWith("io");
    expect(mockIo.to).toHaveBeenCalledWith(auctionId);

    expect(mockEmit).toHaveBeenCalledWith("new_bid", {
      auctionId,
      currentPrice: 1500,
      bid: expect.objectContaining({ bidderLabel: "Bidder 1", amount: 1500 }),
    });
  });

  it("backfills bidder order for an existing auction before accepting a bid", async () => {
    const previousBidderOne = new mongoose.Types.ObjectId();
    const previousBidderTwo = new mongoose.Types.ObjectId();
    const auction = {
      ...liveAuction,
      bids: [new mongoose.Types.ObjectId()],
      uniqueBidders: [],
    };
    findByIdMock.mockResolvedValue(auction);
    bidFindOneMock.mockResolvedValue(null);
    bidFindLeanMock.mockResolvedValue([
      { bidderId: previousBidderOne },
      { bidderId: previousBidderTwo },
      { bidderId: previousBidderOne },
    ]);
    bidSaveMock.mockResolvedValue(true);
    findOneAndUpdateMock
      .mockResolvedValueOnce({ uniqueBidders: [previousBidderOne, previousBidderTwo] })
      .mockResolvedValueOnce({
        ...auction,
        currentPrice: 1500,
        uniqueBidders: [previousBidderOne, previousBidderTwo, new mongoose.Types.ObjectId(bidderId)],
      });

    await auctionBid(req, res);

    expect(bidFindMock).toHaveBeenCalledWith({ auctionId });
    expect(bidFindSortMock).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
    expect(findOneAndUpdateMock.mock.calls[0][0]).toEqual({
      _id: auctionId,
      $or: [
        { uniqueBidders: { $exists: false } },
        { uniqueBidders: { $size: 0 } },
      ],
    });
    expect(mockEmit).toHaveBeenCalledWith("new_bid", expect.objectContaining({
      bid: expect.objectContaining({ bidderLabel: "Bidder 3" }),
    }));
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
    });
  });
});
