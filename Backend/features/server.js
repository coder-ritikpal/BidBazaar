import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import initializeSocket from "./src/socket/connection.js";
import config from "./src/config/config.js";

const PORT = process.env.PORT || 3002;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_URL,
    credentials: true,
  },
});

initializeSocket(io);

// Make io accessible to our router controllers
app.set('io', io);

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Features service with WebSockets is running on port ${PORT}`);
  });
}
