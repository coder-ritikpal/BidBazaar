import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  get MONGODB_URI() {
    return process.env.MONGODB_URI;
  },
   get JWT_SECRET() {
    const secret = process.env.JWT_SECRET;
    // if (!secret) console.error("CRITICAL ERROR: Auth Service JWT_SECRET is not defined in environment variables!"); // Removed debug log
    return secret;
  },
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default_session_secret',
  DASHBOARD_SERVICE_URL: process.env.DASHBOARD_SERVICE_URL || "http://localhost:3004",
};

export default _config;
