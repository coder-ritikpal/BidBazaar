import { jest } from '@jest/globals';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
const signatureFor = () => crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update('r1|p1').digest('hex');
await jest.unstable_mockModule('razorpay', () => ({ default: jest.fn(() => ({ orders: { create: jest.fn() } })) }));
const { default: app } = await import('../../src/app.js');
const token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET);
const body = () => ({ razorpay_order_id: 'r1', razorpay_payment_id: 'p1', razorpay_signature: signatureFor(), internal_order_id: 'o1' });
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: jest.fn().mockResolvedValue(data) });

describe('POST /api/payments/verify', () => {
  beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn(); });
  afterEach(() => delete global.fetch);

  test('rejects invalid signatures', async () => {
    const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send({ ...body(), razorpay_signature: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid payment signature.' });
  });

  test('verifies payment and updates cart', async () => {
    global.fetch.mockResolvedValueOnce(response({ ok: true }));
    const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body());
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verified and order updated/);
    expect(global.fetch).toHaveBeenCalledWith(expect.objectContaining({ href: 'http://localhost:3003/api/orders/o1/pay' }), expect.any(Object));
  });

  test('returns 502 when cart update fails', async () => {
    global.fetch.mockResolvedValueOnce(response({ message: 'Cart unavailable' }, 503));
    const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body());
    expect(res.status).toBe(502);
    expect(res.body.verificationError).toBe('Cart unavailable');
  });

  test('returns 500 when internal order id is missing', async () => {
    const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send({ ...body(), internal_order_id: undefined });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/internal error occurred/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('handles malformed cart responses', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 502, json: jest.fn().mockRejectedValue(new Error('invalid json')) });
    const res = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body());
    expect(res.status).toBe(502);
    expect(res.body.verificationError).toBe('Failed to parse cart service response.');
  });
});
