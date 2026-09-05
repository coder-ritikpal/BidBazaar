import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  get MONGODB_URI() {
    return process.env.MONGODB_URI;
  },
   get JWT_SECRET() {
    const secret = process.env.JWT_SECRET;
    // if (!secret) console.error("CRITICAL ERROR: Dashboard BFF JWT_SECRET is not defined in environment variables!"); // Removed debug log
    return secret;
  },
  
  // Browser Origin values never include a trailing slash. Normalize the
  // deployment value so `https://site.netlify.app/` works as expected.
  FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, ''),
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:3000",
  INVENTORY_SERVICE_URL: process.env.INVENTORY_SERVICE_URL || "http://localhost:3001",
  AUCTIONS_SERVICE_URL: process.env.AUCTIONS_SERVICE_URL || "http://localhost:3002",
  CART_SERVICE_URL: process.env.CART_SERVICE_URL || "http://localhost:3003",
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || "http://localhost:3005",
};

export default _config;
