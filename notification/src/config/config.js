import {config as dotenvConfig} from 'dotenv';

dotenvConfig();

const _config={
    JWT_SECRET: process.env.JWT_SECRET ,
    CLIENT_ID: process.env.CLIENT_ID ,
    CLIENT_SECRET: process.env.CLIENT_SECRET ,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN ,
    EMAIL_USER: process.env.EMAIL_USER ,
    RABBITMQ_URL: process.env.RABBITMQ_URL
}; 

export default Object.freeze(_config);