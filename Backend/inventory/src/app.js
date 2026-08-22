import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";

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
    origin: "http://localhost:5173",
    credentials: true,
  }),
);  

app.use(requestLogger);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get("/", (req, res) => {
  res.json({ message: "Inventory Service is running", version: "1.0.0" });
});



app.use("/api/products", productRoutes);

export default app;

