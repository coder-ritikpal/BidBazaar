import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import orderRoutes from "./routes/order.routes.js";
import config from "./config/config.js";


const app = express();

// Security headers — must be first
app.use(helmet());

app.use(cors(
    {
        origin: [config.FRONTEND_URL, "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }
));
app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Welcome to the Cart Service API");
});

app.use("/api/orders", orderRoutes);


export default app;