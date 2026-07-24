import { jest } from "@jest/globals";

// Mock RabbitMQ
await jest.unstable_mockModule("../../src/broker/rabbit.js", () => ({
  publishToQueue: jest.fn(),
}));

import "../../test/setup.js"

import request from "supertest";
import app from "../../src/app.js";

describe("Auth E2E", () => {
  const user = {
    fullName: {
      firstName: "Ritik",
      lastName: "Pal",
    },
    email: "e2e@test.com",
    password: "123456",
  };

  let token;

  /* -------------------------------------------------------------------------- */
  /*                                HAPPY FLOW                                  */
  /* -------------------------------------------------------------------------- */

  it("should complete full authentication flow", async () => {
    // Register
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(user);

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body.user.email).toBe(user.email);

    // Login
    const loginRes = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.statusCode).toBe(200);

    token = loginRes.body.token;

    expect(token).toBeDefined();

    // Get Profile
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.user.email).toBe(user.email);

    // Update Profile
    const updateRes = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Updated",
      });

    expect(updateRes.statusCode).toBe(200);

    // Logout
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutRes.statusCode).toBe(200);
  });

  /* -------------------------------------------------------------------------- */
  /*                              NEGATIVE TESTS                                */
  /* -------------------------------------------------------------------------- */

  it("should not register duplicate email", async () => {
    await request(app).post("/api/auth/register").send(user);

    const res = await request(app).post("/api/auth/register").send(user);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("User already exists");
  });
  it("should fail login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "wrong-password",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should fail login with unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "unknown@test.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Not authorized, no token");
  });

  it("should reject invalid JWT", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Not authorized, token failed");
  });

  it("should reject profile update without token", async () => {
    const res = await request(app).put("/api/auth/me").send({
      firstName: "NoAuth",
    });

    expect(res.statusCode).toBe(401);
  });

  it("should return 404 for unknown public user", async () => {
    const res = await request(app).get(
      "/api/auth/users/605fe2e2e528a13808dd3b2a",
    );

    expect(res.statusCode).toBe(404);
  });

  it("should return 400 for invalid user id", async () => {
    const res = await request(app).get("/api/auth/users/invalid-id");

    expect(res.statusCode).toBe(400);
  });
});
