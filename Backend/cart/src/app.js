import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import orderRoutes from "./routes/order.routes.js";
import config from "./config/config.js";


const app = express();

app.use(cors(
    {
        origin: [config.FRONTEND_URL, "http://localhost:5173"], // Allow both env variable and local dev
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }
));
app.use(morgan("dev"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Welcome to the Cart Service API");
});

app.use("/api/orders", orderRoutes);


export default app;