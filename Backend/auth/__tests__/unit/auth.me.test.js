import { jest } from '@jest/globals';

// 🔹 mock queue (safe)
await jest.unstable_mockModule('../../src/broker/rabbit.js', () => ({
  publishToQueue: jest.fn(),
}));

// 🔹 setup first
import '../../test/setup.js';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import userModel from '../../src/models/user.model.js';
import config from '../../src/config/config.js';

describe('Auth - Get Me', () => {
  let token;
  let user;

  beforeEach(async () => {
    // create user
    user = await userModel.create({
      fullName: {
        firstName: 'Ritik',
        lastName: 'Pal',
      },
      email: 'me@test.com',
      password: 'hashedpassword',
    });

    // generate token
    token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: '2d',
    });
  });

  // ✅ 1. success
  it('should return current user data', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.id).toBe(user._id.toString());
  });

  // ✅ 2. no token
  it('should return 401 if no token provided', async () => {
    // Temporarily mock the implementation to simulate the middleware error
    // This happens when 'req.headers.authorization' is undefined and we try to .split() it
    jest.spyOn(userModel, 'findById').mockImplementationOnce(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'split')");
    });

    const res = await request(app).get('/api/auth/me');

    // The actual behavior is a 500 error due to the TypeError in the middleware
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Not authorized, no token");
  });

  // ✅ 3. invalid token
  it('should return 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
  });

  // ✅ 4. user not found
  it('should return 401 if user does not exist', async () => {
    const fakeToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011' }, // random id
      config.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.statusCode).toBe(401);
  });
});