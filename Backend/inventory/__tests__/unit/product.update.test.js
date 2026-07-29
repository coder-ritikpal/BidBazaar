import { jest } from "@jest/globals";

const updateAuctionForProduct = jest.fn();
const createAuctionForProduct = jest.fn();

// jest.unstable_mockModule("../../src/services/auction.service.js", () => ({
//   updateAuctionForProduct,
//   createAuctionForProduct,
//   deleteAuctionForProduct: jest.fn(),
// }));

const uploadProductImages = jest.fn();

jest.unstable_mockModule("../../src/services/imagekit.service.js", () => ({
  uploadProductImages,
}));

import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import productModel from "../../src/models/product.model.js";
import { buildProductPayload } from "../helpers/product.helper.js";

const createToken = (sellerId) =>
  jwt.sign({ id: sellerId.toString() }, process.env.JWT_SECRET);

describe("PUT /api/products/:productId", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    });

    updateAuctionForProduct.mockResolvedValue({});
    createAuctionForProduct.mockResolvedValue({
      auction: {
        _id: new mongoose.Types.ObjectId(),
      },
    });
  });

  afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

  it("updates a seller product before review ends", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = createToken(sellerId);

    const product = await productModel.create(buildProductPayload(sellerId));

    product.auctionId = new mongoose.Types.ObjectId();
    await product.save();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Refurbished Camera",
        price: 5200,
        color: "Silver",
        brand: "Nikon",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Product updated successfully");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PUT",
      }),
    );
    const updated = await productModel.findById(product._id);

    expect(updated.title).toBe("Refurbished Camera");
    expect(updated.price).toBe(5200);
    expect(updated.color).toBe("Silver");
    expect(updated.brand).toBe("Nikon");
  });

  it("returns 404 for another seller", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherSeller = new mongoose.Types.ObjectId();

    const product = await productModel.create(buildProductPayload(ownerId));

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(otherSeller)}`)
      .send({
        title: "Hack",
      });

    expect(response.status).toBe(404);
  });

  it("returns 403 after review period", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId, {
        reviewEndsAt: new Date(Date.now() - 1000),
      }),
    );

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(sellerId)}`)
      .send({
        title: "Late Update",
      });

    expect(response.status).toBe(403);
  });
});
