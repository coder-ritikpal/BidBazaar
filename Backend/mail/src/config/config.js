import {config as dotenvConfig} from 'dotenv';

dotenvConfig();

const _config = {
  JWT_SECRET: process.env.JWT_SECRET,
  APP_PASSWORD: process.env.APP_PASSWORD ? process.env.APP_PASSWORD.replace(/\s+/g, '') : undefined,
  EMAIL_USER: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : undefined,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  PORT: process.env.PORT || 3006,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET || 'fallback_internal_secret',
};

export default Object.freeze(_config);