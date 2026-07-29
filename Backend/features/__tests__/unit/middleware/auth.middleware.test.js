import { jest } from "@jest/globals";

const verifyMock = jest.fn();

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: verifyMock,
  },
}));

jest.unstable_mockModule("../../../src/config/config.js", () => ({
  default: {
    JWT_SECRET: "test_secret",
  },
}));

const { authMiddleware } = await import(
  "../../../src/middlewares/auth.middleware.js"
);

describe("authMiddleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("Authentication Success", () => {
    it("should authenticate using cookie token", () => {
      req.cookies.token = "cookie-token";

      verifyMock.mockReturnValue({
        id: "user123",
        email: "test@test.com",
      });

      authMiddleware(req, res, next);

      expect(verifyMock).toHaveBeenCalledWith(
        "cookie-token",
        "test_secret"
      );

      expect(req.user).toEqual({
        id: "user123",
        email: "test@test.com",
      });

      expect(next).toHaveBeenCalled();
    });

    it("should authenticate using bearer token", () => {
      req.headers.authorization = "Bearer bearer-token";

      verifyMock.mockReturnValue({
        id: "user123",
      });

      authMiddleware(req, res, next);

      expect(verifyMock).toHaveBeenCalledWith(
        "bearer-token",
        "test_secret"
      );

      expect(req.user).toEqual({
        id: "user123",
      });

      expect(next).toHaveBeenCalled();
    });

    it("should prefer cookie token over authorization header", () => {
      req.cookies.token = "cookie-token";
      req.headers.authorization = "Bearer header-token";

      verifyMock.mockReturnValue({
        id: "user123",
      });

      authMiddleware(req, res, next);

      expect(verifyMock).toHaveBeenCalledWith(
        "cookie-token",
        "test_secret"
      );

      expect(next).toHaveBeenCalled();
    });
  });

  describe("Authentication Failure", () => {
    it("should return 401 when no token is provided", () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized: No token provided",
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid cookie token", () => {
      req.cookies.token = "invalid-token";

      verifyMock.mockImplementation(() => {
        throw new Error("Invalid");
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized: Invalid token",
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid bearer token", () => {
      req.headers.authorization = "Bearer invalid-token";

      verifyMock.mockImplementation(() => {
        throw new Error("Invalid");
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized: Invalid token",
      });

      expect(next).not.toHaveBeenCalled();
    });
  });
});