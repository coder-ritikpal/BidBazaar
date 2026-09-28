import config from "../config/config.js";
import nodemailer from "nodemailer";
import { google } from "googleapis";

// Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // Required redirect URI for generating tokens via playground
);

// This tells the google-auth library to use our refresh token to get a fresh access token automatically
oAuth2Client.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

const sendEmail = async (to, subject, text, html) => {
  try {
    if (!config.GOOGLE_REFRESH_TOKEN) {
      console.warn("⚠️ GOOGLE_REFRESH_TOKEN is not set. Email will not be sent.");
      return;
    }

    // 1. Create a dummy Nodemailer transporter that DOES NOT send via SMTP,
    // but just generates the raw email string format for us.
    const transporter = nodemailer.createTransport({ streamTransport: true });

    const info = await transporter.sendMail({
      from: `"BidBazaar" <${config.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    // 2. Read the generated raw email stream into a Buffer
    const chunks = [];
    for await (const chunk of info.message) {
      chunks.push(chunk);
    }
    const rawEmailBuffer = Buffer.concat(chunks);

    // 3. Convert the Buffer to base64url format (required by Gmail API)
    const encodedMessage = rawEmailBuffer.toString("base64url");

    // 4. Send the email using the Gmail REST API (Port 443 HTTPS - bypassing Render SMTP blocks!)
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("Message sent successfully via Gmail API:", res.data.id);
  } catch (error) {
    console.error("Error sending email via Gmail API:", error);
  }
};

export default sendEmail;
