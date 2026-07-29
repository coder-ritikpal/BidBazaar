import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { resetAllMocks } from '../../test-config/mocks.js';
import '../../test-config/setup.common.js';

let mongo;

beforeAll(async () => {
  // Start the in-memory server and set the MONGO_URI environment variable.
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri;
  // Explicitly connect Mongoose here to ensure the connection is ready before tests run.
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections after each test
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
  // Reset any other mocks you might have
  resetAllMocks();
});

afterAll(async () => {
  if (mongo) {
    await mongoose.disconnect();
    await mongo.stop();
  }
});