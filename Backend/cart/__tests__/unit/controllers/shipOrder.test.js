import { jest, describe, beforeEach, it, expect } from "@jest/globals";

// -------------------- Mocks --------------------

const mockOrderModel = {
  findById: jest.fn(),
};

jest.unstable_mockModule("../../../src/models/order.model.js", () => ({
  default: mockOrderModel,
}));

const { shipOrder } =
  await import("../../../src/controllers/order.controller.js");

// -------------------- Tests --------------------

describe("shipOrder Controller", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      body: {
        trackingNumber: "TRK123456",
        shippingProvider: "BlueDart",
      },
      user: {
        id: "mockSellerId",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  const mockOrderId = "mockOrderId";

  const mockOrder = {
    _id: mockOrderId,
    sellerId: "mockSellerId",
    winnerId: "mockBuyerId",
    status: "paid",
    save: jest.fn().mockResolvedValue(true),
  };

  it("should successfully mark order as shipped", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue(mockOrder);

    await shipOrder(req, res, next);

    expect(mockOrderModel.findById).toHaveBeenCalledWith(mockOrderId);

    expect(mockOrder.status).toBe("shipped");

    expect(mockOrder.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
      }),
    );
  });

  it('should return 400 if tracking details are missing', async () => {
  req.body = {};

  await shipOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

  it("should return 404 if order does not exist", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue(null);

    await shipOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  it("should return 403 if user is not the seller", async () => {
    req.params.orderId = mockOrderId;
    req.user.id = "anotherSeller";

    mockOrderModel.findById.mockResolvedValue(mockOrder);

    await shipOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to ship this order.",
    });
  });

 
});
