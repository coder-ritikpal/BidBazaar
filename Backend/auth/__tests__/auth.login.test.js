import { jest } from '@jest/globals';

// 🔹 mock queue (not needed here but safe)
await jest.unstable_mockModule('../src/broker/rabbit.js', () => ({
  publishToQueue: jest.fn(),
}));

// 🔹 ensure setup runs
import '../test/setup.js';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import userModel from '../src/models/user.model.js';
import config from '../src/config/config.js';

describe('Auth - Login', () => {
  const userData = {
    fullName: {
      firstName: 'Ritik',
      lastName: 'Pal',
    },
    email: 'login@test.com',
    password: '123456',
  };

  // 🔹 create user once before all tests in this suite
  beforeAll(async () => {
    const hashed = await bcrypt.hash(userData.password, 10);

    await userModel.create({
      fullName: userData.fullName,
      email: userData.email,
      password: hashed,
    });
  });

  // ✅ 1. success login
  it('should login user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User logged in successfully');
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.token).toBeDefined();

    const { token } = res.body;
    const decoded = jwt.verify(token, config.JWT_SECRET);

    expect(decoded.id).toBeDefined();
  });

  // ✅ 2. wrong email
  it('should return 401 if user not found', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@test.com',
        password: userData.password,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  // ✅ 3. wrong password
  it('should return 401 if password is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  // ✅ 4. internal error
  it('should return 500 if something fails', async () => {
    jest.spyOn(userModel, 'findOne').mockImplementationOnce(() => {
      throw new Error('DB error');
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});