import { jest } from "@jest/globals";

// ---------- Mocks ----------
const uploadProductImages = jest.fn();
// const createAuctionForProduct = jest.fn();

jest.unstable_mockModule("../../src/services/imagekit.service.js", () => ({
  uploadProductImages,
}));

// ---------- Imports ----------
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { buildProductPayload } from "../helpers/product.helper.js";

let app;
let productModel;

beforeAll(async () => {
  ({ default: app } = await import("../../src/app.js"));
  ({ default: productModel } = await import("../../src/models/product.model.js"));
});

describe("POST /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    uploadProductImages.mockResolvedValue([
      {
        url: "https://example.com/image.jpg",
        thumbnailUrl: "https://example.com/thumb.jpg",
        id: "image_1",
      },
    ]);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        auction: {
          _id: new mongoose.Types.ObjectId().toString(),
        },
      }),
    });

  //   createAuctionForProduct.mockResolvedValue({
  //     auction: {
  //       _id: new mongoose.Types.ObjectId(),
  //     },
  //   });
   });

  afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

  it("creates a product successfully", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const token = jwt.sign({ id: sellerId.toString() }, process.env.JWT_SECRET);

    const payload = buildProductPayload(sellerId);

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", payload.title)
      .field("description", payload.description)
      .field("price", payload.price)
      .field("category", payload.category)
      .field("size", payload.size)
      .field("sizeUnit", payload.sizeUnit)
      .field("weight", payload.weight)
      .field("weightUnit", payload.weightUnit)
      .field("color", payload.color)
      .field("material", payload.material)
      .field("brand", payload.brand)
      .field("condition", payload.condition)
      .field("auctionDuration", payload.auctionDuration)
      .field("auctionDurationUnit", payload.auctionDurationUnit)
      .field("startOption", "now")
      .attach("images", Buffer.from("fake-image"), "camera.jpg");

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Product created successfully");

    expect(uploadProductImages).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auctions"),
      expect.objectContaining({
        method: "POST",
      }),
    );
    const savedProduct = await productModel.findById(response.body.product._id);

    expect(savedProduct).not.toBeNull();
    expect(savedProduct.title).toBe(payload.title);
    expect(savedProduct.material).toBe(payload.material);
    expect(savedProduct.category).toBe(payload.category);
    expect(savedProduct.sellerId.toString()).toBe(sellerId.toString());
    expect(savedProduct.auctionId).toBeDefined();
  });

});



