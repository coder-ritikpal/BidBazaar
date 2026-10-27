import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findBidsMock = jest.fn();
const sortMock = jest.fn();
const skipMock = jest.fn();
const limitMock = jest.fn();
const leanBidsMock = jest.fn();
const findAuctionMock = jest.fn();
const selectMock = jest.fn();
const leanAuctionMock = jest.fn();
const countDocumentsMock = jest.fn();

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {
    find: findBidsMock,
    countDocuments: countDocumentsMock,
  },
}));

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: { findById: findAuctionMock },
}));

const { getBidsForAuction } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("getBidsForAuction", () => {
  let req;
  let res;
  const auctionId = new mongoose.Types.ObjectId().toHexString();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { auctionId }, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    findBidsMock.mockReturnValue({ sort: sortMock });
    sortMock.mockReturnValue({ skip: skipMock });
    skipMock.mockReturnValue({ limit: limitMock });
    limitMock.mockReturnValue({ lean: leanBidsMock });
    findAuctionMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ lean: leanAuctionMock });
    leanAuctionMock.mockResolvedValue({ _id: auctionId });
    countDocumentsMock.mockResolvedValue(0);
  });

  it("fetches paginated bids and assigns stable public labels", async () => {
    const bids = [
      { _id: "2", auctionId, amount: 200, bidderId: "bidder2" },
      { _id: "1", auctionId, amount: 100, bidderId: "bidder1" },
    ];
    leanBidsMock.mockResolvedValue(bids);
    countDocumentsMock.mockResolvedValue(2);

    await getBidsForAuction(req, res);

    expect(findBidsMock).toHaveBeenCalledWith({ auctionId });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(skipMock).toHaveBeenCalledWith(0);
    expect(limitMock).toHaveBeenCalledWith(50);
    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response).toMatchObject({
      message: "Bids fetched successfully.",
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
      bids: [
        { _id: "2", bidderLabel: expect.stringMatching(/^Bidder [a-f0-9]{7}$/) },
        { _id: "1", bidderLabel: expect.stringMatching(/^Bidder [a-f0-9]{7}$/) },
      ],
    });
  });

  it("marks the authenticated viewer's bids as self", async () => {
    const bidderId = new mongoose.Types.ObjectId().toHexString();
    req.user = { id: bidderId };
    leanBidsMock.mockResolvedValue([
      { _id: "1", auctionId, amount: 100, bidderId },
    ]);

    await getBidsForAuction(req, res);

    expect(res.json.mock.calls[0][0].bids[0]).toMatchObject({
      isSelf: true,
      bidderLabel: "You",
    });
  });

  it("returns 400 for an invalid auction ID", async () => {
    jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

    await getBidsForAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid auction ID format." });
  });

  it("returns 404 when the auction does not exist", async () => {
    leanAuctionMock.mockResolvedValue(null);
    leanBidsMock.mockResolvedValue([]);

    await getBidsForAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Auction not found." });
  });

  it("returns 500 on database error", async () => {
    leanBidsMock.mockRejectedValue(new Error("Database error"));

    await getBidsForAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch bids." });
  });
});
