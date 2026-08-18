import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const _config = {
  PORT: process.env.CART_SERVICE_PORT || 3003,
  MONGODB_URI: process.env.MONGODB_URI || process.env.DB_URI,
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-jwt-secret' : undefined),
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  AUCTIONS_SERVICE_URL: process.env.AUCTIONS_SERVICE_URL || "http://localhost:3002",
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default Object.freeze(_config);
