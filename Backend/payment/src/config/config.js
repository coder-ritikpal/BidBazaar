import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const _config = {
  // Hosting providers such as Render assign the listening port through PORT.
  // Keep the service-specific variable for local backwards compatibility.
  PORT: process.env.PORT || process.env.PAYMENT_SERVICE_PORT || 3005,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  CART_SERVICE_URL: process.env.CART_SERVICE_URL || 'http://localhost:3003',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
};

export default Object.freeze(_config);
