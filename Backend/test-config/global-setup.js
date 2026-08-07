import { MongoMemoryServer } from "mongodb-memory-server";

export default async () => {
  console.log("Starting global MongoMemoryServer...");
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Set the URI in the global environment for the test suites to use
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_SERVER_INSTANCE__ = mongoServer;
};