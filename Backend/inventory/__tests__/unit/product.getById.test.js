import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import productModel from "../../src/models/product.model.js";
import { buildProductPayload } from "../helpers/product.helper.js";

const createToken = (sellerId) =>
  jwt.sign({ id: sellerId.toString() }, process.env.JWT_SECRET);

describe("GET /api/products/:productId", () => {
  it("returns a product by id for its seller", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId, {
        title: "Vintage Camera",
      })
    );

    const response = await request(app)
      .get(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Product fetched successfully");

    expect(response.body.product).toMatchObject({
      _id: product._id.toString(),
      sellerId: sellerId.toString(),
      title: "Vintage Camera",
      material: "Metal",
      category: "Electronics",
    });
  });

  it("returns 401 when unauthorized", async () => {
    const productId = new mongoose.Types.ObjectId();

    const response = await request(app).get(
      `/api/products/${productId}`
    );

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("returns 404 when product does not exist", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/products/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Product not found");
  });

  it("returns 404 when product belongs to another seller", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherSeller = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(ownerId)
    );

    const response = await request(app)
      .get(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(otherSeller)}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Product not found");
  });

  it("updates reviewStatus to approved when review has ended", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId, {
        reviewStatus: "under_review",
        reviewEndsAt: new Date(Date.now() - 1000),
      })
    );

    const response = await request(app)
      .get(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    expect(response.status).toBe(200);

    const updated = await productModel.findById(product._id);

    expect(updated.reviewStatus).toBe("approved");
  });

  it("keeps reviewStatus under_review when review period is active", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create(
      buildProductPayload(sellerId, {
        reviewStatus: "under_review",
        reviewEndsAt: new Date(Date.now() + 60 * 60 * 1000),
      })
    );

    await request(app)
      .get(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${createToken(sellerId)}`);

    const unchanged = await productModel.findById(product._id);

    expect(unchanged.reviewStatus).toBe("under_review");
  });
});