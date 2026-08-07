import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// -------------------- Mocks --------------------

const mockOrderModel = {
  find: jest.fn(),
};

jest.unstable_mockModule('../../../src/models/order.model.js', () => ({
  default: mockOrderModel,
}));

const { getSoldOrders } = await import('../../../src/controllers/order.controller.js');

// -------------------- Tests --------------------

describe('getSoldOrders Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        id: 'mockSellerId',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should fetch sold orders successfully', async () => {
    const soldOrders = [
      {
        _id: 'order1',
        sellerId: 'mockSellerId',
        status: 'paid',
      },
      {
        _id: 'order2',
        sellerId: 'mockSellerId',
        status: 'shipped',
      },
    ];

    mockOrderModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(soldOrders),
    });

    await getSoldOrders(req, res);

    expect(mockOrderModel.find).toHaveBeenCalledWith({
      sellerId: 'mockSellerId',
      status: {
        $in: ['paid', 'shipped', 'delivered'],
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Sold orders fetched successfully.',
      orders: soldOrders,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    req.user = null;

    await getSoldOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized. Please log in.',
    });
  });

  it('should return an empty array when seller has no sold orders', async () => {
    mockOrderModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    await getSoldOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Sold orders fetched successfully.',
      orders: [],
    });
  });

  it('should return 500 if database throws an error', async () => {
    mockOrderModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('Database Error')),
    });

    await getSoldOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to fetch sold orders.',
      error: 'Database Error',
    });
  });
});