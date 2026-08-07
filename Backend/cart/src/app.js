import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import orderRoutes from "./routes/order.routes.js";


const app = express();

app.use(cors(
    {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }
));
app.use(morgan("dev"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/orders", orderRoutes);


export default app;