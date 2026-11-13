import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// -------------------- Mocks --------------------

const mockOrderModel = {
  find: jest.fn(),
  countDocuments: jest.fn(),
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
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(soldOrders),
          }),
        }),
      }),
    });
    mockOrderModel.countDocuments.mockResolvedValue(2);

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
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
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
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    mockOrderModel.countDocuments.mockResolvedValue(0);

    await getSoldOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Sold orders fetched successfully.',
      orders: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it('should return 500 if database throws an error', async () => {
    mockOrderModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('Database Error')),
          }),
        }),
      }),
    });
    mockOrderModel.countDocuments.mockResolvedValue(0);

    await getSoldOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to fetch sold orders.',
    });
  });
});