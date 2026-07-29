import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findByIdMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    findById: findByIdMock,
  },
}));

const { updateAuction } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("updateAuction", () => {
  let req, res;
  const auctionId = new mongoose.Types.ObjectId().toHexString();

  const mockAuction = {
    _id: auctionId,
    title: "Old Title",
    description: "Old Description",
    auctionDuration: 1,
    auctionDurationUnit: "days",
    startingPrice: 100,
    currentPrice: 100,
    startAuctionAt: new Date(),
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { auctionId },
      body: {
        title: "New Title",
        description: "New Description",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Reset the mock auction object before each test
    Object.assign(mockAuction, {
      title: "Old Title",
      description: "Old Description",
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    });
    findByIdMock.mockResolvedValue(mockAuction);
  });

  it("should update an auction successfully", async () => {
    await updateAuction(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(auctionId);
    expect(mockAuction.title).toBe("New Title");
    expect(mockAuction.description).toBe("New Description");
    expect(mockAuction.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Auction updated successfully" })
    );
  });

  it("should return 404 if auction is not found", async () => {
    findByIdMock.mockResolvedValue(null);

    await updateAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Auction not found" });
  });

  it("should return 400 for invalid auction duration unit", async () => {
    req.body.auctionDurationUnit = "invalid-unit";

    await updateAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      { message: "Auction duration unit must be one of: minutes, hours, days." }
    );
  });

  it("should update startingPrice and currentPrice", async () => {
    req.body = { startingPrice: 200 };

    await updateAuction(req, res);

    expect(mockAuction.startingPrice).toBe(200);
    expect(mockAuction.currentPrice).toBe(200);
    expect(mockAuction.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle database errors on save", async () => {
    const saveError = new Error("DB save failed");
    mockAuction.save.mockRejectedValue(saveError);

    await updateAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update auction",
      error: "DB save failed",
    });
  });
});