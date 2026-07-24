import { jest } from '@jest/globals';

// 🔹 increase timeout
jest.setTimeout(30000);

// 🔹 mock BEFORE imports
const mockPublish = jest.fn();

await jest.unstable_mockModule('../../src/broker/rabbit.js', () => ({
  publishToQueue: mockPublish,
}));

// 🔹 IMPORTANT: ensure DB setup runs first
import '../../test/setup.js';

// 🔹 now import rest
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import userModel from '../../src/models/user.model.js';
import config from '../../src/config/config.js';

describe('Auth - Register', () => {
  const userData = {
    fullName: {
      firstName: 'Ritik',
      lastName: 'Pal',
    },
    email: 'ritik@test.com',
    password: '123456',
  };

  // ✅ 1. success case
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.user.email).toBe(userData.email);
  });

  // ✅ 2. duplicate user
  it('should not register if user already exists', async () => {
    await userModel.create({
      fullName: userData.fullName,
      email: userData.email,
      password: 'hashed',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('User already exists');
  });

  // ✅ 3. JWT + cookie check
  it('should set cookie and return valid JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: { firstName: 'Test', lastName: 'User' },
        email: 'jwt@test.com',
        password: '123456',
      });

    expect(res.body.token).toBeDefined();
    
    const { token } = res.body;
    const decoded = jwt.verify(token, config.JWT_SECRET);
    expect(decoded.id).toBeDefined();
  });

  // ✅ 4. internal server error
  it('should return 500 if something fails', async () => {
    jest.spyOn(userModel, 'findOne').mockImplementationOnce(() => {
      throw new Error('DB error');
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});