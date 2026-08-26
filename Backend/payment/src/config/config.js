import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const _config = {
  // Hosting providers such as Render assign the listening port through PORT.
  // Keep the service-specific variable for local backwards compatibility.
  PORT:  process.env.PAYMENT_SERVICE_PORT || 3005,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  CART_SERVICE_URL: process.env.CART_SERVICE_URL || 'http://localhost:3003',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET,
};

export default Object.freeze(_config);
