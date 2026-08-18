import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'test_key';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret';
process.env.INTERNAL_AUTH_TOKEN_SECRET = process.env.INTERNAL_AUTH_TOKEN_SECRET || 'test_internal_secret';
process.env.CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3003';

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
