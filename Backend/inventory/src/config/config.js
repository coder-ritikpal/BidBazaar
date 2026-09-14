import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  get MONGODB_URI() {
    return process.env.MONGODB_URI;
  },
  // ImageKit Credentials
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,

  REVIEW_WINDOW_MINUTES: process.env.REVIEW_WINDOW_MINUTES || 30,
  MIN_AUCTION_DURATION_MINUTES: process.env.MIN_AUCTION_DURATION_MINUTES || 10,
  AUCTIONS_SERVICE_URL: process.env.AUCTIONS_SERVICE_URL || "http://localhost:3002",
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET || "fallback_internal_secret",
};

export default Object.freeze(_config);