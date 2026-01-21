import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  MONGODB_URI: process.env.MONGODB_URI ,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
};

export default _config;
