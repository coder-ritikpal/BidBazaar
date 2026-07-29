import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findMock = jest.fn();
const sortMock = jest.fn();

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {
    find: findMock,
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
    jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
  });

  it("should fetch bids for an auction successfully", async () => {
    const bids = [{ amount: 100 }, { amount: 200 }];
    sortMock.mockResolvedValue(bids);

    await getBidsForAuction(req, res);

    expect(findMock).toHaveBeenCalledWith({ auctionId });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Bids fetched successfully.",
      bids,
    });
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
      error: "Database error",
    });
  });
});