import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import productModel from "../../src/models/product.model.js";
import { buildProductPayload } from "../helpers/product.helper.js";

const createToken = (sellerId) =>
  jwt.sign({ id: sellerId.toString() }, process.env.JWT_SECRET);

describe("GET /api/products/seller", () => {
  it("returns only the logged in seller products", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const otherSeller = new mongoose.Types.ObjectId();

    await productModel.create(
      buildProductPayload(sellerId, {
        title: "Camera",
      })
    );

    await productModel.create(
      buildProductPayload(otherSeller, {
        title: "Laptop",
      })
    );

    const response = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Seller products fetched successfully"
    );

    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].sellerId).toBe(
      sellerId.toString()
    );
    expect(response.body.products[0].title).toBe("Camera");
  });

  it("returns an empty array when seller has no products", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([]);
  });

  it("returns 401 when user is unauthorized", async () => {
    const response = await request(app).get("/api/products/seller");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("updates seller products whose review period has ended", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId, {
        reviewStatus: "under_review",
        reviewEndsAt: new Date(Date.now() - 1000),
      })
    );

    const response = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(200);

    const updated = await productModel.findById(product._id);

    expect(updated.reviewStatus).toBe("approved");
  });

  it("returns products sorted by newest first", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const first = await productModel.create(
      buildProductPayload(sellerId, {
        title: "Old Product",
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 20));

    const second = await productModel.create(
      buildProductPayload(sellerId, {
        title: "New Product",
      })
    );

    const response = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(200);

    expect(response.body.products[0]._id).toBe(
      second._id.toString()
    );
    expect(response.body.products[1]._id).toBe(
      first._id.toString()
    );
  });
});