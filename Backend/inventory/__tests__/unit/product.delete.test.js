import { jest } from "@jest/globals";

const deleteAuctionForProduct = jest.fn();

// jest.unstable_mockModule("../../src/services/auction.service.js", () => ({
//   deleteAuctionForProduct,
//   updateAuctionForProduct: jest.fn(),
//   createAuctionForProduct: jest.fn(),
// }));

import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import productModel from "../../src/models/product.model.js";
import { buildProductPayload } from "../helpers/product.helper.js";

const createToken = (sellerId) =>
  jwt.sign({ id: sellerId.toString() }, process.env.JWT_SECRET);

describe("DELETE /api/products/:productId", () => {
  beforeEach(() => {
    jest.clearAllMocks();


  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 204,
  });

    deleteAuctionForProduct.mockResolvedValue({});
  });


  afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

  it("deletes seller product", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId)
    );

    product.auctionId = new mongoose.Types.ObjectId();
    await product.save();

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Product deleted successfully");

expect(global.fetch).toHaveBeenCalledWith(
  expect.any(String),
  expect.objectContaining({
    method: "DELETE",
  })
);
    const deleted = await productModel.findById(product._id);

    expect(deleted).toBeNull();
  });

  it("returns 404 for another seller", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherSeller = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(ownerId)
    );

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(otherSeller)}`);

    expect(response.status).toBe(404);
  });

  it("returns 403 after review period", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId, {
        reviewEndsAt: new Date(Date.now() - 1000),
      })
    );

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(403);
  });
});