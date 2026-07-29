import { jest } from "@jest/globals";

const findByIdMock = jest.fn();
const bidFindOneMock = jest.fn();

jest.unstable_mockModule("mongoose", () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: jest.fn(),
      },
    },
  },
}));

const mongoose = (await import("mongoose")).default;

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

jest.unstable_mockModule("../../../src/models/user.model.js", () => ({
  default: {},
}));

jest.unstable_mockModule("../../../src/services/cart.service.js", () => ({
  createOrderForAuction: jest.fn(),
}));

jest.unstable_mockModule("../../../src/config/config.js", () => ({
  default: {
    MIN_AUCTION_DURATION_MINUTES: 5,
  },
}));

jest.unstable_mockModule(
  "../../../src/constants/auction.constants.js",
  () => ({
    AUCTION_DURATION_UNITS: ["minutes", "hours", "days"],
  }),
);

const { getAuctionById } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("getAuctionById", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {
        auctionId: "507f191e810c19729de860ea",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 400 for invalid auction id", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    await getAuctionById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid auction ID format.",
    });
  });

  it("should return 404 when auction does not exist", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    findByIdMock.mockResolvedValue(null);

    await getAuctionById(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(req.params.auctionId);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Auction not found",
    });
  });

  it("should fetch auction successfully", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const auction = {
      _id: req.params.auctionId,
      title: "MacBook Pro",
      currentPrice: 50000,
      startAuctionAt: new Date(Date.now() - 60000),
      auctionDuration: 1,
      auctionDurationUnit: "days",
      cancelledAt: null,
      endAuctionAt: null,
      winnerId: null,
      deleteAt: null,
      toObject() {
        return {
          _id: this._id,
          title: this.title,
          currentPrice: this.currentPrice,
        };
      },
      save: jest.fn(),
    };

    findByIdMock.mockResolvedValue(auction);
    bidFindOneMock.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });

    await getAuctionById(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(req.params.auctionId);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Auction fetched successfully",
      }),
    );
  });

  it("should set winner and deleteAt for an ended auction", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const endedAuction = {
      _id: req.params.auctionId,
      title: "Ended Auction",
      startAuctionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      auctionDuration: 1,
      auctionDurationUnit: "days",
      cancelledAt: null,
      endAuctionAt: null,
      winnerId: null, // Winner not yet set
      deleteAt: null, // deleteAt not yet set
      toObject: jest.fn().mockReturnThis(),
      save: jest.fn().mockResolvedValue(true),
    };

    const winningBid = {
      bidderId: "winner123",
      _id: "winbid123",
    };

    findByIdMock.mockResolvedValue(endedAuction);
    bidFindOneMock.mockReturnValue({
      sort: jest.fn().mockResolvedValue(winningBid),
    });

    await getAuctionById(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(req.params.auctionId);
    expect(bidFindOneMock).toHaveBeenCalledWith({ auctionId: endedAuction._id });
    expect(endedAuction.save).toHaveBeenCalled();
    expect(endedAuction.winnerId).toBe("winner123");
    expect(endedAuction.deleteAt).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        auction: expect.objectContaining({ status: "ended" }),
      })
    );
  });

  it("should handle CastError", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const error = new Error("Cast failed");
    error.name = "CastError";

    findByIdMock.mockRejectedValue(error);

    await getAuctionById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      message: `Invalid auction ID: ${req.params.auctionId}`,
    });
  });

  it("should handle unexpected server error", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    findByIdMock.mockRejectedValue(
      new Error("Unexpected database failure"),
    );

    await getAuctionById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch auction due to a server error.",
      error: "Unexpected database failure",
    });
  });
});
