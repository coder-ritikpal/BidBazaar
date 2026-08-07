import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// -------------------- Mocks --------------------

const mockOrderModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

jest.unstable_mockModule('../../../src/models/order.model.js', () => ({
  default: mockOrderModel,
}));

jest.unstable_mockModule('../../../src/config/config.js', () => ({
  default: {
    AUCTIONS_SERVICE_URL: 'http://mock-auctions-service',
  },
}));

const { createOrder } = await import('../../../src/controllers/order.controller.js');
const { default: config } = await import('../../../src/config/config.js');

// -------------------- Tests --------------------

describe('createOrder Controller', () => {
  let req;
  let res;

  global.fetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: {
        id: 'mockUserId',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  const mockAuctionId = 'mockAuctionId';

  const mockAuction = {
    _id: mockAuctionId,
    productId: 'mockProductId',
    sellerId: 'mockSellerId',
    winnerId: 'mockUserId',
    currentPrice: 150,
    status: 'ended',
    title: 'Mock Auction',
    images: [
      {
        url: 'http://example.com/image.png',
      },
    ],
  };

  it('should create an order successfully', async () => {
    req.body.auctionId = mockAuctionId;

    mockOrderModel.findOne.mockResolvedValue(null);

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        auction: mockAuction,
      }),
    });

    mockOrderModel.create.mockResolvedValue({
      ...mockAuction,
      status: 'pending_payment',
    });

    await createOrder(req, res);

    expect(mockOrderModel.findOne).toHaveBeenCalledWith({
      auctionId: mockAuctionId,
    });

    expect(fetch).toHaveBeenCalledWith(
      new URL(
        `/api/auctions/${mockAuctionId}`,
        config.AUCTIONS_SERVICE_URL
      )
    );

    expect(mockOrderModel.create).toHaveBeenCalledWith({
      auctionId: mockAuctionId,
      productId: mockAuction.productId,
      sellerId: mockAuction.sellerId,
      winnerId: mockAuction.winnerId,
      amount: mockAuction.currentPrice,
      status: 'pending_payment',
      itemDetails: {
        title: mockAuction.title,
        image: mockAuction.images[0].url,
      },
    });

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Item added to cart successfully.',
      })
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    req.user = null;

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized. Please log in.',
    });
  });

  it('should return 400 if auctionId is missing', async () => {
    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'auctionId is required',
    });
  });

  it('should return 403 if user is not the winner', async () => {
    req.body.auctionId = mockAuctionId;

    mockOrderModel.findOne.mockResolvedValue(null);

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        auction: {
          ...mockAuction,
          winnerId: 'anotherUserId',
        },
      }),
    });

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'You are not the winner of this auction.',
    });
  });

  it('should return 404 if auction is not found', async () => {
    req.body.auctionId = mockAuctionId;

    mockOrderModel.findOne.mockResolvedValue(null);

    fetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Auction not found.',
    });
  });
});