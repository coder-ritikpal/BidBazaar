export default async () => {
  console.log("Stopping global MongoMemoryServer...");
  if (global.__MONGO_SERVER_INSTANCE__) {
    await global.__MONGO_SERVER_INSTANCE__.stop();
  }
};