import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app.js";
import productModel from "../../src/models/product.model.js";
import { buildProductPayload } from "../helpers/product.helper.js";

describe("GET /api/products", () => {
  it("returns all products", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create(buildProductPayload(sellerId));
    await productModel.create(
      buildProductPayload(new mongoose.Types.ObjectId(), {
        title: "iPhone",
      })
    );

    const response = await request(app).get("/api/products");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Products fetched successfully");
    expect(response.body.products).toHaveLength(2);
  });

  it("returns products sorted by newest first", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const first = await productModel.create(
      buildProductPayload(sellerId, {
        title: "Old Product",
      })
    );

    await new Promise((r) => setTimeout(r, 20));

    const second = await productModel.create(
      buildProductPayload(sellerId, {
        title: "New Product",
      })
    );

    const response = await request(app).get("/api/products");

    expect(response.status).toBe(200);

    expect(response.body.products[0]._id).toBe(second._id.toString());
    expect(response.body.products[1]._id).toBe(first._id.toString());
  });

  it("updates expired review products to approved", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId, {
        reviewStatus: "under_review",
        reviewEndsAt: new Date(Date.now() - 1000),
      })
    );

    const response = await request(app).get("/api/products");

    expect(response.status).toBe(200);

    const updated = await productModel.findById(product._id);

    expect(updated.reviewStatus).toBe("approved");
  });

  it("returns an empty array when no products exist", async () => {
    const response = await request(app).get("/api/products");

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([]);
  });
});