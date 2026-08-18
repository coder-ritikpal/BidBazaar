import { jest } from '@jest/globals';
import request from 'supertest';
await jest.unstable_mockModule('razorpay', () => ({ default: jest.fn(() => ({ orders: { create: jest.fn() } })) }));
const { default: app } = await import('../../src/app.js');

describe('Payment authentication', () => {
  test.each([
    ['without a token', undefined, 'Unauthorized: No token provided'],
    ['with an invalid token', 'Bearer invalid-token', 'Unauthorized: Invalid token'],
  ])('rejects create-order %s', async (_label, authorization, message) => {
    const req = request(app).post('/api/payments/create-order').send({ amount: 100, orderId: 'o1' });
    if (authorization) req.set('Authorization', authorization);
    const res = await req;
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message });
  });

  test('rejects payment verification without authentication', async () => {
    const res = await request(app).post('/api/payments/verify').send({});
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized: No token provided' });
  });
});
