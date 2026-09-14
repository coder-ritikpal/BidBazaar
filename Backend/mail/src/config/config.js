import {config as dotenvConfig} from 'dotenv';

dotenvConfig();

const _config = {
  JWT_SECRET: process.env.JWT_SECRET,
  APP_PASSWORD: process.env.APP_PASSWORD,
  EMAIL_USER: process.env.EMAIL_USER,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  INTERNAL_AUTH_TOKEN_SECRET: process.env.INTERNAL_AUTH_TOKEN_SECRET || 'fallback_internal_secret',
};

export default Object.freeze(_config);