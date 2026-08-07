import { jest, describe, beforeEach, it, expect } from "@jest/globals";

// -------------------- Mocks --------------------

const mockOrderModel = {
  findById: jest.fn(),
};

jest.unstable_mockModule("../../../src/models/order.model.js", () => ({
  default: mockOrderModel,
}));

const { confirmDelivery } =
  await import("../../../src/controllers/order.controller.js");

// -------------------- Tests --------------------

describe("confirmDelivery Controller", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      user: {
        id: "mockBuyerId",
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
    status: "shipped",
    save: jest.fn().mockResolvedValue(true),
  };

  it("should successfully confirm delivery", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue(mockOrder);

    await confirmDelivery(req, res, next);

    expect(mockOrderModel.findById).toHaveBeenCalledWith(mockOrderId);

    expect(mockOrder.status).toBe("delivered");

    expect(mockOrder.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Delivery confirmed. Thank you!",
      }),
    );
  });

  it("should return 404 if order is not found", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue(null);

    await confirmDelivery(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  it("should return 403 if user is not the buyer", async () => {
    req.params.orderId = mockOrderId;
    req.user.id = "anotherBuyer";

    mockOrderModel.findById.mockResolvedValue(mockOrder);

    await confirmDelivery(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to confirm delivery for this order.",
    });
  });

  it("should return 400 if order has not been shipped", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue({
      ...mockOrder,
      status: "paid",
    });

    await confirmDelivery(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      message:
        "Order must be in 'shipped' state to confirm delivery. Current status: paid",
    });
  });
});
