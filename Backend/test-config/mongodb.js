
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

/**
 * Start Mongo Memory Server and connect Mongoose
 */
export const connectTestDB = async () => {
    mongoServer = await MongoMemoryServer.create();

    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
};

/**
 * Remove all documents from every collection
 */
export const clearTestDB = async () => {
  // Guard against calling this if the connection is not established
  if (!mongoose.connection.db) {
    return;
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Disconnect Mongoose and stop Mongo Memory Server
 */
export const disconnectTestDB = async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
};