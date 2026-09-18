import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  get MONGODB_URI() {
    return process.env.MONGODB_URI;
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET;
  },
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  CART_SERVICE_URL: process.env.CART_SERVICE_URL || "http://localhost:3003",
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET || "internal_secret_for_microservices",
  MIN_AUCTION_DURATION_MINUTES: process.env.MIN_AUCTION_DURATION_MINUTES || 10,
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",
};

export default _config;
