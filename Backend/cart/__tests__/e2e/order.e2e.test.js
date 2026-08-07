import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jest, beforeAll, beforeEach, afterEach, describe, it, expect } from '@jest/globals';

import app from '../../src/app.js';
import Order from '../../src/models/order.model.js';

global.fetch = jest.fn();

describe('Order API (Integration)', () => {
  let winnerToken;
  let otherUserToken;

  let winnerId;
  let otherUserId;
  let sellerId;

  const auctionId = new mongoose.Types.ObjectId();

  const mockAuction = {
    _id: auctionId,
    productId: new mongoose.Types.ObjectId(),
    sellerId: new mongoose.Types.ObjectId(),
    winnerId: null,
    currentPrice: 250,
    status: 'ended',
    title: 'Test Auction',
    images: [
      {
        url: 'http://example.com/image.png',
      },
    ],
  };

  beforeAll(() => {
    winnerId = new mongoose.Types.ObjectId();
    otherUserId = new mongoose.Types.ObjectId();
    sellerId = mockAuction.sellerId;

    mockAuction.winnerId = winnerId;

    winnerToken = jwt.sign(
      {
        id: winnerId,
        email: 'winner@test.com',
      },
      process.env.JWT_SECRET
    );

    otherUserToken = jwt.sign(
      {
        id: otherUserId,
        email: 'other@test.com',
      },
      process.env.JWT_SECRET
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await Order.deleteMany({});
  });

  afterEach(async () => {
    await Order.deleteMany({});
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          auction: mockAuction,
        }),
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${winnerToken}`)
        .send({
          auctionId,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe(
        'Item added to cart successfully.'
      );

      expect(res.body.order.status).toBe(
        'pending_payment'
      );

      const order = await Order.findById(
        res.body.order._id
      );

      expect(order).not.toBeNull();
    });

    it('should return 403 if user is not winner', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          auction: mockAuction,
        }),
      });

      const res = await request(app)
        .post('/api/orders')
        .set(
          'Authorization',
          `Bearer ${otherUserToken}`
        )
        .send({
          auctionId,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe(
        'You are not the winner of this auction.'
      );
    });

    it('should return 404 when auction is missing', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${winnerToken}`)
        .send({
          auctionId,
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe(
        'Auction not found.'
      );
    });

    it('should return 400 if auctionId is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${winnerToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe(
        'auctionId is required'
      );
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          auctionId,
        });

      expect(res.statusCode).toBe(401);
    });

    it('should return existing order if already created', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          auction: mockAuction,
        }),
      });

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${winnerToken}`)
        .send({
          auctionId,
        });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${winnerToken}`)
        .send({
          auctionId,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
        'Item is already in your cart or ordered.'
      );
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('should fetch current user orders', async () => {
      await Order.create({
        auctionId,
        productId: mockAuction.productId,
        sellerId,
        winnerId,
        amount: 250,
        status: 'pending_payment',
        itemDetails: {
          title: 'Test Auction',
          image: 'http://example.com/image.png',
        },
      });

      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${winnerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.orders).toHaveLength(1);
    });
  });
});