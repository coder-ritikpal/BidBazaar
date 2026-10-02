import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test_jwt_secret';
const razorpayOrders = { create: jest.fn() };
await jest.unstable_mockModule('razorpay', () => ({ default: jest.fn(() => ({ orders: razorpayOrders })) }));
const { default: app } = await import('../../src/app.js');
const token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET);

describe('POST /api/payments/create-order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        order: {
          winnerId: 'user-1',
          status: 'pending_payment',
          amount: 100
        }
      })
    });
  });
  
  afterEach(() => {
    delete global.fetch;
  });

  test('requires order id', async () => {
    const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Order ID is required.' });
  });

  test('rejects non-positive amounts', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
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
    expect(res.body).toEqual({ message: 'Invalid order amount.' });
  });

  test('creates an order with the protection fee', async () => {
    razorpayOrders.create.mockResolvedValueOnce({ id: 'pay_order_1', amount: 20500 });
    const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ orderId: 'o1' });
    expect(res.status).toBe(200);
    expect(razorpayOrders.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 20500, currency: 'INR', receipt: 'receipt_order_o1' }));
  });

  test('accepts decimal numeric strings', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        order: {
          winnerId: 'user-1',
          status: 'pending_payment',
          amount: '99.50'
        }
      })
    });
    razorpayOrders.create.mockResolvedValueOnce({ id: 'pay_order_2' });
    await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ orderId: 'o2' });
    expect(razorpayOrders.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 20448, notes: expect.objectContaining({ protectionFee: '104.97', totalAmount: '204.47' }) }));
  });

  test('returns 500 when Razorpay fails', async () => {
    razorpayOrders.create.mockRejectedValueOnce(new Error('Razorpay unavailable'));
    const res = await request(app).post('/api/payments/create-order').set('Authorization', `Bearer ${token}`).send({ orderId: 'o1' });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ message: 'Failed to create payment order.' });
  });
});
