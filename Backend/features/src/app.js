import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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

app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auctions", auctionRoutes);

export default app;
