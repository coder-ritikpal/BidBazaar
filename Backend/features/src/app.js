import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import auctionRoutes from "./routes/auction.routes.js";
import config from "./config/config.js";

let requestLogger = (_req, _res, next) => next();

try {
  const { default: morgan } = await import("morgan");
  requestLogger = morgan("dev");
} catch {
  // Allow the app to boot even when the optional logger dependency is absent.
}

const app = express();

// Security headers — must be first
app.use(helmet());

const allowedOrigins = [
  config.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://rp-bidbazaar.netlify.app",
  "https://bidbazaar.netlify.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin && origin.startsWith(o))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(requestLogger);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());


app.get("/", (req, res) => {
  res.json({ message: "Features Service is running", version: "1.0.0" });
});


app.use("/api/auctions", auctionRoutes);

export default app;
