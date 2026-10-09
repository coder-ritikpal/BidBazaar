import { jest } from '@jest/globals';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import Payment from '../../src/models/payment.model.js';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
process.env.INTERNAL_AUTH_TOKEN_SECRET = 'test_internal_secret';

import { MockAgent, setGlobalDispatcher } from 'undici';

const mockAgent = new MockAgent();
mockAgent.disableNetConnect();
setGlobalDispatcher(mockAgent);
const mockPool = mockAgent.get('http://localhost:3003');

const mockFetch = jest.fn();
await jest.unstable_mockModule('../../src/utils/fetch.js', () => ({
  doFetch: mockFetch
}));
// We'll route the mock agent through mockFetch so the existing test assertions work
mockPool.intercept({ path: () => true, method: () => true }).reply(async (options) => {
  const url = new URL(options.path, 'http://localhost:3003');
  const res = await mockFetch(url, options);
  return {
    statusCode: res.status,
    data: await res.json()
  };
}).persist();

const razorpayOrders = { create: jest.fn() };
await jest.unstable_mockModule('razorpay', () => ({
  default: jest.fn(() => ({ orders: razorpayOrders })),
}));

const { default: app } = await import('../../src/app.js');
const token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET);
const signatureFor = () => crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update('r1|p1').digest('hex');
const cartResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(data),
});

describe('Payment API E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/payments/create-order', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          order: {
            winnerId: 'user-1',
            status: 'pending_payment',
            amount: 100
          }
        })
      });
    });

    test('rejects unauthenticated requests', async () => {
      const res = await request(app).post('/api/payments/create-order').send({ orderId: 'o1' });
      expect(res.status).toBe(401);
    });

    test('validates input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          order: {
            winnerId: 'user-1',
            status: 'pending_payment',
            amount: -10
          }
        })
      });
      const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ orderId: 'o1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid order amount.');
    });

    test('creates an order through the mocked Razorpay client', async () => {
      razorpayOrders.create.mockResolvedValueOnce({ id: 'pay_order_1', amount: 20500 });
      const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ orderId: 'o1' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'pay_order_1', amount: 20500, currency: 'INR' });
      expect(razorpayOrders.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 20500, receipt: 'receipt_order_o1' }));
    });

    test('returns a service error when Razorpay fails', async () => {
      razorpayOrders.create.mockRejectedValueOnce(new Error('Razorpay unavailable'));
      const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ orderId: 'o1' });
      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to create payment order.');
    });
  });

  describe('POST /api/payments/verify', () => {
    const body = () => ({ razorpay_order_id: 'r1', razorpay_payment_id: 'p1', razorpay_signature: signatureFor(), internal_order_id: 'o1' });

    beforeEach(async () => {
      await Payment.create({
        orderId: 'o1',
        userId: 'user-1',
        razorpayOrderId: 'r1',
        amount: 20000,
        status: 'created',
      });
    });

    test('rejects invalid signatures', async () => {
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send({ ...body(), razorpay_signature: 'bad' });
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('verifies payment and updates the cart service', async () => {
      mockFetch.mockResolvedValue(cartResponse({ updated: true }));
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body());
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/verified and order updated/);
    });

    test('returns 502 when the cart service rejects the update', async () => {
      mockFetch.mockResolvedValue(cartResponse({ message: 'Cart unavailable' }, 503));
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body());
      expect(res.status).toBe(502);
      expect(res.body).not.toHaveProperty('verificationError');
    });

    test('returns 500 when the internal order id is missing', async () => {
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send({ ...body(), internal_order_id: undefined });
      expect(res.status).toBe(500);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
