import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  get MONGODB_URI() {
    return process.env.MONGODB_URI;
  },
  // ImageKit Credentials
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,

  REVIEW_WINDOW_MINUTES: process.env.REVIEW_WINDOW_MINUTES || 30,
  MIN_AUCTION_DURATION_MINUTES: process.env.MIN_AUCTION_DURATION_MINUTES || 10,
  AUCTIONS_SERVICE_URL: process.env.AUCTIONS_SERVICE_URL || "http://localhost:3002",
};

export default Object.freeze(_config);