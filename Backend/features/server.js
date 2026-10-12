import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import initializeSocket from "./src/socket/connection.js";
import config from "./src/config/config.js";
import startResolveAuctionsCron from "./src/cron/resolveAuctions.js";
import { connectRabbitMQ } from "./src/broker/rabbit.js";
import { connectRedis } from "./src/cache/redis.js";

const PORT = process.env.PORT || 3002;

const allowedOrigins = [
  config.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://rp-bidbazaar.netlify.app",
  "https://bidbazaar.netlify.app",
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin && origin.startsWith(o))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

initializeSocket(io);

// Make io accessible to our router controllers
app.set('io', io);

if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await connectDB();
      await connectRabbitMQ();
      connectRedis();
      startResolveAuctionsCron();

      server.listen(PORT, () => {
        console.log(`Features service with WebSockets is running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start features service:", error);
      process.exit(1);
    }
  })();
}
