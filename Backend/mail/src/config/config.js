import {config as dotenvConfig} from 'dotenv';

dotenvConfig();

const _config = {
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  EMAIL_USER: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : undefined,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  PORT: process.env.PORT || 3006,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET,
};

if (process.env.NODE_ENV !== 'test' && !_config.INTERNAL_AUTH_TOKEN_SECRET) {
  console.error("CRITICAL ERROR: INTERNAL_AUTH_TOKEN_SECRET environment variable is missing.");
  process.exit(1);
}

export default Object.freeze(_config);
