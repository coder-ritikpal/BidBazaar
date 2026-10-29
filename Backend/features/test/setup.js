import { jest } from '@jest/globals';
import mongoose from 'mongoose';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB from '../src/db/db.js';// adjust path

let mongo;

beforeAll(async () => {
  if (!process.env.MONGO_URI) {
    try {
      mongo = await MongoMemoryServer.create();
      process.env.MONGO_URI = mongo.getUri();
    } catch {
      process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test_features';
    }
  }
  process.env.JWT_SECRET = 'test_jwt_secret';

  await connectDB(); // ✅ use same connection logic
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) {
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
