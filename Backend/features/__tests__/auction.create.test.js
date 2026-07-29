import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import auctionModel from "../src/models/auction.model.js";

describe("POST /api/auctions", () => {
  it("creates an auction in under_review state for a product", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const reviewEndsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const startAuctionAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const response = await request(app)
      .post("/api/auctions")
      .send({
        productId,
        sellerId,
        title: "Vintage Camera",
        description: "Film camera in great condition",
        category: "Electronics",
        startingPrice: 4500,
        reviewEndsAt,
        startAuctionAt,
        auctionDuration: 7,
        images: [],
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Auction created successfully");
    expect(response.body.auction).toMatchObject({
      productId: productId.toString(),
      sellerId: sellerId.toString(),
      title: "Vintage Camera",
      currentPrice: 4500,
      startingPrice: 4500,
      status: "under_review",
    });

    const savedAuction = await auctionModel.findOne({ productId }).lean();
    expect(savedAuction).not.toBeNull();
    expect(savedAuction.currentPrice).toBe(4500);
  });
});
