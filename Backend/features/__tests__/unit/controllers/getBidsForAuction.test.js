import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findMock = jest.fn();
const sortMock = jest.fn();
const findByIdMock = jest.fn();
const selectMock = jest.fn();
const leanMock = jest.fn();

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {
    find: findMock,
  },
}));

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    findById: findByIdMock,
  },
}));

const { getBidsForAuction } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("getBidsForAuction", () => {
  let req, res;
  const auctionId = new mongoose.Types.ObjectId().toHexString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { auctionId },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    findMock.mockReturnValue({ sort: sortMock });
    findByIdMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ lean: leanMock });
  });

  it("should fetch bids for an auction successfully", async () => {
    const bids = [{ _id: '1', amount: 100, bidderId: 'bidder1' }, { _id: '2', amount: 200, bidderId: 'bidder2' }];
    sortMock.mockResolvedValue(bids);
    leanMock.mockResolvedValue({ uniqueBidders: ['bidder2', 'bidder1'] }); // simulate labels

    await getBidsForAuction(req, res);

    expect(findMock).toHaveBeenCalledWith({ auctionId });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Bids fetched successfully.",
        bids: [
          expect.objectContaining({ _id: '2', bidderLabel: 'Bidder 1' }),
          expect.objectContaining({ _id: '1', bidderLabel: 'Bidder 2' }),
        ],
      })
    );
  });

  it("assigns labels from chronological history for legacy auctions", async () => {
    sortMock.mockResolvedValue([
      { _id: '1', amount: 100, bidderId: 'bidder1' },
      { _id: '2', amount: 200, bidderId: 'bidder2' },
      { _id: '3', amount: 300, bidderId: 'bidder1' },
    ]);
    leanMock.mockResolvedValue({ uniqueBidders: [] });

    await getBidsForAuction(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      bids: [
        expect.objectContaining({ _id: '3', bidderLabel: 'Bidder 1' }),
        expect.objectContaining({ _id: '2', bidderLabel: 'Bidder 2' }),
        expect.objectContaining({ _id: '1', bidderLabel: 'Bidder 1' }),
      ],
    }));
  });

  it("should return 400 for an invalid auction ID", async () => {
    jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

    await getBidsForAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid auction ID format.",
    });
  });

  it("should return 500 on database error", async () => {
    const dbError = new Error("Database error");
    sortMock.mockRejectedValue(dbError);

    await getBidsForAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch bids.",
    });
  });
});
