import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";

const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, "test_jwt_secret");

const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
});

describe("dashboard proxy routes", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("forwards the public auction list to the auctions service", async () => {
    global.fetch.mockResolvedValueOnce(response({ auctions: [] }));

    const res = await request(app).get("/api/dashboard/auctions");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ auctions: [] });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost:3002/api/auctions" }),
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("forwards an optional bearer token for a public auction detail request", async () => {
    global.fetch.mockResolvedValueOnce(response({ auction: { _id: "auction-1" } }));

    const res = await request(app)
      .get("/api/dashboard/auctions/auction-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ auction: { _id: "auction-1" } });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost:3002/api/auctions/auction-1" }),
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    );
  });

  test("rejects bidding without authentication before calling the auctions service", async () => {
    const res = await request(app)
      .post("/api/dashboard/auctions/auction-1/bid")
      .send({ amount: 100 });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Not authorized, no token" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("forwards authenticated profile requests to the auth service", async () => {
    global.fetch.mockResolvedValueOnce(response({ user: { id: "user-1" } }));

    const res = await request(app)
      .get("/api/dashboard/profile/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: "user-1" } });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost:3000/api/auth/me" }),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    );
  });

  test("returns downstream errors from authenticated order requests", async () => {
    global.fetch.mockResolvedValueOnce(response({ message: "Cart unavailable" }, 503));

    const res = await request(app)
      .get("/api/dashboard/orders/my-orders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ message: "Cart unavailable" });
  });

  test("forwards registration data and returns the auth token", async () => {
    global.fetch.mockResolvedValueOnce(
      response({ message: "Registered", user: { id: "user-1" }, token: "auth-token" }),
    );
    const body = { email: "user@test.com", password: "secret" };

    const res = await request(app).post("/api/dashboard/auth/register").send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: "Registered",
      user: { id: "user-1" },
      token: "auth-token",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost:3000/api/auth/register" }),
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });

  test("returns auth-service login errors", async () => {
    global.fetch.mockResolvedValueOnce(response({ message: "Invalid credentials" }, 401));

    const res = await request(app)
      .post("/api/dashboard/auth/login")
      .send({ email: "wrong@test.com", password: "bad" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid credentials" });
  });

  test("redirects to the auth service for Google login", async () => {
    const res = await request(app).get("/api/dashboard/auth/google");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:3000/api/auth/google");
  });

  test("redirects failed Google callbacks to the frontend login page", async () => {
    const res = await request(app).get("/api/dashboard/auth/google/callback");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:5173/login?error=google_auth_failed");
  });

  test("forwards payment verification with authentication", async () => {
    global.fetch.mockResolvedValueOnce(response({ verified: true }));

    const res = await request(app)
      .post("/api/dashboard/payments/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId: "order-1", paymentId: "payment-1" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ verified: true });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost:3005/api/payments/verify" }),
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: `Bearer ${token}` }) }),
    );
  });

  test("forwards the current user's listed inventory", async () => {
    global.fetch.mockResolvedValueOnce(response({ products: [{ id: "product-1" }] }));

    const res = await request(app)
      .get("/api/dashboard/inventory/listed-items")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ products: [{ id: "product-1" }] });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost:3001/api/products/seller" }),
      expect.any(Object),
    );
  });
});
