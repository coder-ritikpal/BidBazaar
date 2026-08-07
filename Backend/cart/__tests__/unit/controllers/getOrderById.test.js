import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// -------------------- Mocks --------------------

const mockOrderModel = {
  findById: jest.fn(),
};

jest.unstable_mockModule('../../../src/models/order.model.js', () => ({
  default: mockOrderModel,
}));

const { getOrderById } = await import('../../../src/controllers/order.controller.js');

// -------------------- Tests --------------------

describe('getOrderById Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      user: {
        id: 'mockUserId',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  const mockOrderId = 'mockOrderId';

  const mockOrder = {
    _id: mockOrderId,
    winnerId: 'mockUserId',
    sellerId: 'mockSellerId',
    amount: 150,
    status: 'pending_payment',
  };

  it('should fetch an order successfully', async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockOrder),
    });

    await getOrderById(req, res, next);

    expect(mockOrderModel.findById).toHaveBeenCalledWith(mockOrderId);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Order fetched successfully.',
      order: mockOrder,
    });
  });

  it('should return 404 if order does not exist', async () => {
    req.params.orderId = mockOrderId;

    mockOrderModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await getOrderById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Order not found.',
    });
  });

  it('should return 403 if user is neither buyer nor seller', async () => {
    req.params.orderId = mockOrderId;
    req.user.id = 'anotherUser';

    mockOrderModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockOrder),
    });

    await getOrderById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      message: 'You are not authorized to view this order.',
    });
  });

  it('should allow seller to view the order', async () => {
    req.params.orderId = mockOrderId;
    req.user.id = mockOrder.sellerId;

    mockOrderModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockOrder),
    });

    await getOrderById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
  });

 
});