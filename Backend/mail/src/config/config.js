import {config as dotenvConfig} from 'dotenv';

dotenvConfig();

const _config = {
  JWT_SECRET: process.env.JWT_SECRET,
  APP_PASSWORD: process.env.APP_PASSWORD,
  EMAIL_USER: process.env.EMAIL_USER,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
};

export default Object.freeze(_config);