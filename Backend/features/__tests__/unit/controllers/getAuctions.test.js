import { jest } from "@jest/globals";

const sortMock = jest.fn();
const findMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    find: findMock,
  },
}));

jest.unstable_mockModule("../../../src/models/bid.model.js", () => ({
  default: {
    findOne: jest.fn(),
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

const { getAuctions } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("getAuctions", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    findMock.mockReturnValue({
      sort: sortMock,
    });
  });

  it("should return all auctions", async () => {
    const auctions = [
      {
        _id: "1",
        title: "Auction 1",
        startAuctionAt: new Date(Date.now() - 10000),
        auctionDuration: 1,
        auctionDurationUnit: "days",
        currentPrice: 100,
        toObject() {
          return {
            _id: this._id,
            title: this.title,
            currentPrice: this.currentPrice,
          };
        },
      },
      {
        _id: "2",
        title: "Auction 2",
        startAuctionAt: new Date(Date.now() - 10000),
        auctionDuration: 1,
        auctionDurationUnit: "days",
        currentPrice: 200,
        toObject() {
          return {
            _id: this._id,
            title: this.title,
            currentPrice: this.currentPrice,
          };
        },
      },
    ];

    sortMock.mockResolvedValue(auctions);

    await getAuctions({}, res);

    expect(findMock).toHaveBeenCalledWith({});

    expect(sortMock).toHaveBeenCalledWith({
      createdAt: -1,
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Auctions fetched successfully",
      }),
    );

    const response = res.json.mock.calls[0][0];

    expect(response.auctions).toHaveLength(2);
  });

  it("should return empty array when no auctions exist", async () => {
    sortMock.mockResolvedValue([]);

    await getAuctions({}, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: "Auctions fetched successfully",
      auctions: [],
    });
  });

  it("should return 500 if database throws error", async () => {
    sortMock.mockRejectedValue(new Error("Database Error"));

    await getAuctions({}, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch auctions",
      error: "Database Error",
    });
  });

  it("should return auctions in descending order", async () => {
    sortMock.mockResolvedValue([]);

    await getAuctions({}, res);

    expect(sortMock).toHaveBeenCalledWith({
      createdAt: -1,
    });
  });
});