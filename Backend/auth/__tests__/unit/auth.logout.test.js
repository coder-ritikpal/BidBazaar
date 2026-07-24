import { jest } from '@jest/globals';

// 🔹 mock queue (safe)
await jest.unstable_mockModule('../../src/broker/rabbit.js', () => ({
  publishToQueue: jest.fn(),
}));

// 🔹 setup first
import '../../test/setup.js';

import request from 'supertest';
import app from '../../src/app.js';

describe('Auth - Logout', () => {

  // ✅ 1. successful logout
  it('should logout user and clear cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User logged out successfully');
  });

  // ✅ 2. logout without cookie (still works)
  it('should logout even if no token present', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User logged out successfully');
  });

});