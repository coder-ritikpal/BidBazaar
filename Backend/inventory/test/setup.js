import { jest } from '@jest/globals';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB from '../src/db/db.js';// adjust path

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test_jwt_secret';

  await connectDB(); // ✅ use same connection logic
});

afterEach(async () => {
  if (!mongoose.connection.db) {
    return;
  }

  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});
