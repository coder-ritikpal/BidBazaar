import { jest, describe, beforeEach, it, expect } from "@jest/globals";

// -------------------- Mocks --------------------

const mockOrderModel = {
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../../../src/models/order.model.js", () => ({
  default: mockOrderModel,
}));

const { payForOrder } =
  await import("../../../src/controllers/order.controller.js");

// -------------------- Tests --------------------

describe("payForOrder Controller", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      user: {
        id: "mockUserId",
        service: "payment-service",
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
    winnerId: "mockUserId",
    status: "pending_payment",
    save: jest.fn().mockResolvedValue(true),
  };

  it("should successfully mark order as paid", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue(mockOrder);
    mockOrderModel.findOneAndUpdate.mockResolvedValue({ ...mockOrder, status: "paid" });

    await payForOrder(req, res, next);

    expect(mockOrderModel.findById).toHaveBeenCalledWith(mockOrderId);
    expect(mockOrderModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: mockOrderId,
        winnerId: "mockUserId",
        status: { $in: ['pending_payment', 'cancelled_unpaid'] },
      },
      { $set: { status: 'paid' } },
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Payment successful! Your order is being processed.",
      }),
    );
  });

  it("should return 404 if order does not exist", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue(null);

    await payForOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order not found in cart.",
    });
  });

  it("should return 403 if user is not the buyer", async () => {
    req.params.orderId = mockOrderId;
    req.user.id = "anotherUser";

    mockOrderModel.findById.mockResolvedValue(mockOrder);

    await payForOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to pay for this item.",
    });
  });

  it("should return 400 if order is not awaiting payment", async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockResolvedValue({
      ...mockOrder,
      status: "shipped",
    });

    await payForOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "This order cannot be paid. Current status: shipped.",
    });
  });

  it("should return 200 if order is already paid", async () => {
    req.params.orderId = mockOrderId;

    const paidOrder = {
      ...mockOrder,
      status: "paid",
    };
    mockOrderModel.findById.mockResolvedValue(paidOrder);

    await payForOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: "Order is already paid.",
      order: paidOrder,
    });
  });
});
