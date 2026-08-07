import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// -------------------- Mocks --------------------

const mockOrderModel = {
  find: jest.fn(),
};

jest.unstable_mockModule('../../../src/models/order.model.js', () => ({
  default: mockOrderModel,
}));

const { getMyOrders } = await import('../../../src/controllers/order.controller.js');

// -------------------- Tests --------------------

describe('getMyOrders Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        id: 'mockUserId',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should fetch and return user orders', async () => {
    const mockOrders = [
      {
        _id: 'order1',
        winnerId: 'mockUserId',
        itemDetails: {
          title: 'Item 1',
        },
      },
    ];

    mockOrderModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockOrders),
    });

    await getMyOrders(req, res);

    expect(mockOrderModel.find).toHaveBeenCalledWith({
      winnerId: 'mockUserId',
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Orders fetched successfully.',
      orders: mockOrders,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    req.user = null;

    await getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized. Please log in.',
    });
  });

  it('should return an empty array if user has no orders', async () => {
    mockOrderModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    await getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Orders fetched successfully.',
      orders: [],
    });
  });

  
});