import { jest } from '@jest/globals';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';

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
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('POST /api/payments/create-order', () => {
    test('rejects unauthenticated requests', async () => {
      const res = await request(app).post('/api/payments/create-order').send({ amount: 100, orderId: 'o1' });
      expect(res.status).toBe(401);
    });

    test('validates input', async () => {
      const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ amount: -10, orderId: 'o1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid amount provided.');
    });

    test('creates an order through the mocked Razorpay client', async () => {
      razorpayOrders.create.mockResolvedValueOnce({ id: 'pay_order_1', amount: 20500 });
      const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ amount: 100, orderId: 'o1' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'pay_order_1', amount: 20500 });
      expect(razorpayOrders.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 20500, receipt: 'receipt_order_o1' }));
    });

    test('returns a service error when Razorpay fails', async () => {
      razorpayOrders.create.mockRejectedValueOnce(new Error('Razorpay unavailable'));
      const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ amount: 100, orderId: 'o1' });
      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to create payment order.');
    });
  });

  describe('POST /api/payments/verify', () => {
    const body = () => ({ razorpay_order_id: 'r1', razorpay_payment_id: 'p1', razorpay_signature: signatureFor(), internal_order_id: 'o1' });

    test('rejects invalid signatures', async () => {
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send({ ...body(), razorpay_signature: 'bad' });
      expect(res.status).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('verifies payment and updates the cart service', async () => {
      global.fetch.mockResolvedValueOnce(cartResponse({ updated: true }));
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body());
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/verified and order updated/);
      expect(global.fetch).toHaveBeenCalledWith(expect.objectContaining({ href: 'http://localhost:3003/api/orders/o1/pay' }), expect.objectContaining({ method: 'POST' }));
    });

    test('returns 502 when the cart service rejects the update', async () => {
      global.fetch.mockResolvedValueOnce(cartResponse({ message: 'Cart unavailable' }, 503));
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body());
      expect(res.status).toBe(502);
      expect(res.body.verificationError).toBe('Cart unavailable');
    });

    test('returns 500 when the internal order id is missing', async () => {
      const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send({ ...body(), internal_order_id: undefined });
      expect(res.status).toBe(500);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
