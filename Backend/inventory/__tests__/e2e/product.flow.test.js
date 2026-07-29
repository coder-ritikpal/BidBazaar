import { jest } from "@jest/globals";

// ---------- Mocks ----------
const uploadProductImages = jest.fn();

jest.unstable_mockModule("../../src/services/imagekit.service.js", () => ({
  uploadProductImages,
}));

// ---------- Imports ----------
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

let app;

beforeAll(async () => {
  ({ default: app } = await import("../../src/app.js"));
});

describe("Product Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    uploadProductImages.mockResolvedValue([
      {
        url: "https://example.com/image.jpg",
        thumbnailUrl: "https://example.com/thumb.jpg",
        id: "img1",
      },
    ]);

    global.fetch = jest.fn((url, options) => {
      switch (options.method) {
        case "POST":
          return Promise.resolve({
            ok: true,
            status: 201,
            json: async () => ({
              auction: {
                _id: new mongoose.Types.ObjectId().toString(),
              },
            }),
          });

        case "PUT":
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          });

        case "DELETE":
          return Promise.resolve({
            ok: true,
            status: 204,
            json: async () => ({}),
          });

        default:
          return Promise.reject(
            new Error(`Unexpected ${options.method} request`),
          );
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it("should complete the full product lifecycle", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const token = jwt.sign({ id: sellerId.toString() }, process.env.JWT_SECRET);

    /* ---------------- CREATE ---------------- */

    const createRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Vintage Camera")
      .field("description", "Fully functional")
      .field("price", 4500)
      .field("category", "Electronics")
      .field("size", "10*20")
      .field("sizeUnit", "cm")
      .field("weight", 2)
      .field("weightUnit", "kg")
      .field("color", "Black")
      .field("material", "Metal")
      .field("brand", "Canon")
      .field("condition", "Good")
      .field("auctionDuration", 7)
      .field("auctionDurationUnit", "days")
      .field("startOption", "now")
      .attach("images", Buffer.from("fake"), "camera.jpg");

    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toBe("Product created successfully");

    expect(uploadProductImages).toHaveBeenCalledTimes(1);

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/auctions"),
      expect.objectContaining({
        method: "POST",
      }),
    );

    const productId = createRes.body.product._id;

    /* ---------------- GET BY ID ---------------- */

    const getRes = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.product.title).toBe("Vintage Camera");

    /* ---------------- GET SELLER ---------------- */

    const sellerRes = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${token}`);

    expect(sellerRes.status).toBe(200);
    expect(sellerRes.body.products).toHaveLength(1);

    /* ---------------- GET ALL ---------------- */

    const allRes = await request(app).get("/api/products");

    expect(allRes.status).toBe(200);
    expect(allRes.body.products.length).toBeGreaterThan(0);

    /* ---------------- UPDATE ---------------- */

    const updateRes = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Camera",
        color: "Silver",
      });

    expect(updateRes.status).toBe(200);

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/auctions"),
      expect.objectContaining({
        method: "PUT",
      }),
    );

    /* ---------------- DELETE ---------------- */

    const deleteRes = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/api/auctions"),
      expect.objectContaining({
        method: "DELETE",
      }),
    );

    /* ---------------- VERIFY ---------------- */

    const finalRes = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(finalRes.status).toBe(404);
  });
});
