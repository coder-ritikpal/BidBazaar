import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";

const findByIdMock = jest.fn();
const findOneMock = jest.fn();
const createMock = jest.fn();
const saveMock = jest.fn();

jest.unstable_mockModule("../../src/models/auction.model.js", () => ({
  default: {
    findById: findByIdMock,
    findOne: findOneMock,
    create: createMock,
  },
}));

jest.unstable_mockModule("../../src/models/bid.model.js", () => ({
  default: {
    create: createMock,
    find: jest.fn(),
    findOne: findOneMock,
    distinct: jest.fn(),
  },
}));

const { default: app } = await import("../../src/app.js");

describe("Auction API Integration", () => {
  const auctionId = new mongoose.Types.ObjectId().toHexString();
  const sellerId = new mongoose.Types.ObjectId().toHexString();
  const bidderId = new mongoose.Types.ObjectId().toHexString();

  const liveAuction = {
    _id: new mongoose.Types.ObjectId(auctionId),
    productId: new mongoose.Types.ObjectId().toHexString(),
    sellerId,
    title: "Test Product",
    description: "Test auction",
    category: "Electronics",
    startingPrice: 1000,
    currentPrice: 1000,
    startAuctionAt: new Date(Date.now() - 60 * 1000),
    auctionDuration: 1,
    auctionDurationUnit: "days",
    bids: [],
    toObject() {
      return { ...this };
    },
    save: saveMock,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    app.set("io", {
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    });
  });

  describe("GET /api/auctions/:auctionId", () => {
    it("should return an auction", async () => {
      findByIdMock.mockResolvedValue(liveAuction);

      const response = await request(app)
        .get(`/api/auctions/${auctionId}`)
        .expect(200);

      expect(response.body.message).toBe("Auction fetched successfully");
      expect(response.body.auction).toBeDefined();
      expect(findByIdMock).toHaveBeenCalledWith(auctionId);
    });

    it("should return 400 for invalid auction ID", async () => {
      const response = await request(app)
        .get("/api/auctions/invalid-id")
        .expect(400);

      expect(response.body.message).toBe("Invalid auction ID format.");
    });

    it("should return 404 when auction does not exist", async () => {
      findByIdMock.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/auctions/${auctionId}`)
        .expect(404);

      expect(response.body.message).toBe("Auction not found");
    });
  });

  describe("POST /api/auctions/:auctionId/bid", () => {
    it("should reject an unauthenticated bid", async () => {
      const response = await request(app)
        .post(`/api/auctions/${auctionId}/bid`)
        .send({ amount: 1500 })
        .expect(401);

      expect(response.body.message).toBe(
        "Unauthorized: No token provided",
      );
    });
  });

  describe("GET /api/auctions", () => {
    it("should return auctions", async () => {
      const sortMock = jest.fn().mockResolvedValue([liveAuction]);

      const findMock = jest.fn().mockReturnValue({
        sort: sortMock,
      });

      const auctionModel = await import("../../src/models/auction.model.js");

      auctionModel.default.find = findMock;

      const response = await request(app)
        .get("/api/auctions")
        .expect(200);

      expect(response.body.message).toBe("Auctions fetched successfully");
      expect(response.body.auctions).toBeInstanceOf(Array);
    });
  });
});