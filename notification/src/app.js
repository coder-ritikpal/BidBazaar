import express from 'express';
import sendEmail from './utils/email.js';


const app = express();

sendEmail('palritik156@gmail.com',"Test Email","This is a test email from BidBazaar.",
    "<h1>This is a test email from BidBazaar.</h1>");



export default app;