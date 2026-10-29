import { jest } from '@jest/globals';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.AUTH_SERVICE_URL = 'http://localhost:3000';
process.env.INVENTORY_SERVICE_URL = 'http://localhost:3001';
process.env.AUCTIONS_SERVICE_URL = 'http://localhost:3002';
process.env.CART_SERVICE_URL = 'http://localhost:3003';
process.env.PAYMENT_SERVICE_URL = 'http://localhost:3005';

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
