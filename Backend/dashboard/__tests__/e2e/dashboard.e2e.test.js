import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../../src/app.js";
import wishlistModel from "../../src/models/wishlist.model.js";

const JWT_SECRET = "test_jwt_secret";
const userId = new mongoose.Types.ObjectId();
const auctionId = new mongoose.Types.ObjectId();
let wishlistStore;

const tokenFor = (id = userId) => jwt.sign({ id: String(id) }, JWT_SECRET);
const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
});

describe("Dashboard BFF", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    wishlistStore = [];
    jest.spyOn(wishlistModel, "find").mockImplementation(() => ({
      sort: () => ({ lean: async () => [...wishlistStore] }),
    }));
    jest.spyOn(wishlistModel, "create").mockImplementation(async (item) => {
      if (wishlistStore.some((saved) => String(saved.userId) === String(item.userId) && String(saved.auctionId) === String(item.auctionId))) {
        throw { code: 11000 };
      }
      const saved = { ...item, snapshot: { ...item.snapshot } };
      wishlistStore.push(saved);
      return saved;
    });
    jest.spyOn(wishlistModel, "findOneAndDelete").mockImplementation(async (query) => {
      const index = wishlistStore.findIndex((saved) => String(saved.userId) === String(query.userId) && String(saved.auctionId) === String(query.auctionId));
      if (index < 0) return null;
      return wishlistStore.splice(index, 1)[0];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test("returns a healthy service response", async () => {
    const res = await request(app).get("/api/dashboard/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: "dashboard" });
  });

  test("rejects protected requests without a bearer token", async () => {
    const res = await request(app).get("/api/dashboard/wishlist");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Not authorized, no token" });
  });

  test("validates the auction id before adding a wishlist item", async () => {
    const res = await request(app)
      .post("/api/dashboard/wishlist")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "auctionId is required" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("adds an auction snapshot to the authenticated user's wishlist", async () => {
    global.fetch.mockResolvedValueOnce(
      response({
        auction: {
          title: "Vintage Camera",
          images: [{ url: "camera.jpg" }],
          currentBid: 125,
          startingBid: 50,
          status: "active",
        },
      }),
    );

    const res = await request(app)
      .post("/api/dashboard/wishlist")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({ auctionId: String(auctionId) });

    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({
      _id: String(auctionId),
      title: "Vintage Camera",
      currentBid: 125,
      startingBid: 50,
      status: "active",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: `http://localhost:3002/api/auctions/${auctionId}`,
      }),
      { method: "GET" },
    );
    expect(wishlistStore).toHaveLength(1);
  });

  test("prevents duplicate wishlist entries", async () => {
    await wishlistModel.create({ userId, auctionId, snapshot: { title: "Already saved" } });
    global.fetch.mockResolvedValueOnce(response({ title: "Already saved" }));

    const res = await request(app)
      .post("/api/dashboard/wishlist")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({ auctionId: String(auctionId) });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Item already in wishlist" });
  });

  test("lists and removes wishlist items for the authenticated user", async () => {
    await wishlistModel.create({ userId, auctionId, snapshot: { title: "Saved item", price: 80 } });

    const list = await request(app)
      .get("/api/dashboard/wishlist")
      .set("Authorization", `Bearer ${tokenFor()}`);

    expect(list.status).toBe(200);
    expect(list.body.wishlist).toEqual([
      expect.objectContaining({ _id: String(auctionId), title: "Saved item", price: 80 }),
    ]);

    const remove = await request(app)
      .delete(`/api/dashboard/wishlist/${auctionId}`)
      .set("Authorization", `Bearer ${tokenFor()}`);

    expect(remove.status).toBe(200);
    expect(remove.body).toEqual({ message: "Removed from wishlist." });
    expect(wishlistStore).toHaveLength(0);
  });

  test("returns not found when removing a missing wishlist item", async () => {
    const res = await request(app)
      .delete(`/api/dashboard/wishlist/${auctionId}`)
      .set("Authorization", `Bearer ${tokenFor()}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Wishlist item not found" });
  });

  test("forwards public auction requests without requiring authentication", async () => {
    global.fetch.mockResolvedValueOnce(response({ auctions: [{ _id: "a1" }] }));

    const res = await request(app).get("/api/dashboard/auctions");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ auctions: [{ _id: "a1" }] });
    expect(global.fetch).toHaveBeenCalledWith(expect.objectContaining({ href: "http://localhost:3002/api/auctions" }), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  });

  test("forwards authenticated order requests with the token and JSON body", async () => {
    global.fetch.mockResolvedValueOnce(response({ orderId: "order-1" }));
    const body = { items: [{ productId: "p1", quantity: 2 }] };
    const token = tokenFor();

    const res = await request(app)
      .post("/api/dashboard/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ orderId: "order-1" });
    expect(global.fetch).toHaveBeenCalledWith(expect.objectContaining({ href: "http://localhost:3003/api/orders" }), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  });

  test("propagates downstream proxy errors", async () => {
    global.fetch.mockResolvedValueOnce(response({ message: "Auctions unavailable" }, 503));

    const res = await request(app).get("/api/dashboard/auctions");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ message: "Auctions unavailable" });
  });
});
