import { jest } from "@jest/globals";

const createMock = jest.fn();
const findOneMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    create: createMock,
    findOne: findOneMock,
  },
}));

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {},
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

const { createAuction } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("createAuction", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        productId: "507f191e810c19729de860ea",
        sellerId: "507f191e810c19729de860eb",
        title: "iPhone",
        description: "Good condition",
        category: "Electronics",
        startingPrice: 1000,
        reviewEndsAt: new Date(Date.now() + 1000),
        startAuctionAt: new Date(Date.now() + 10000),
        auctionDuration: 10,
        auctionDurationUnit: "minutes",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should create auction successfully", async () => {
    findOneMock.mockResolvedValue(null);

    const createdAuction = {
      ...req.body,
      currentPrice: 1000,
      toObject: jest.fn().mockReturnValue({
        ...req.body,
        currentPrice: 1000,
      }),
      save: jest.fn(),
    };

    createMock.mockResolvedValue(createdAuction);

    await createAuction(req, res);

    expect(findOneMock).toHaveBeenCalledWith({
      productId: req.body.productId,
    });

    expect(createMock).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Auction created successfully",
      }),
    );
  });

  it("should return existing auction if already present", async () => {
    const existingAuction = {
      ...req.body,
      currentPrice: 1000,
      toObject: jest.fn().mockReturnValue(req.body),
    };

    findOneMock.mockResolvedValue(existingAuction);

    await createAuction(req, res);

    expect(createMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        isExisting: true,
      }),
    );
  });

  it("should reject invalid duration unit", async () => {
    req.body.auctionDurationUnit = "weeks";

    findOneMock.mockResolvedValue(null);

    await createAuction(req, res);

    expect(createMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should reject duration below minimum", async () => {
    req.body.auctionDuration = 1;
    req.body.auctionDurationUnit = "minutes";

    findOneMock.mockResolvedValue(null);

    await createAuction(req, res);

    expect(createMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to create auction",
      }),
    );
  });

  it("should handle database error", async () => {
    findOneMock.mockResolvedValue(null);

    createMock.mockRejectedValue(new Error("Database Error"));

    await createAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to create auction",
        error: "Database Error",
      }),
    );
  });
});