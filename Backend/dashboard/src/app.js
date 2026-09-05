import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dashboardRoutes from "./routes/dashboard.routes.js";
import config from "./config/config.js";


const app = express();

app.use(cors(
    {
        // The frontend is deployed separately from this BFF.  Keep localhost
        // working for development while allowing the configured production URL.
        origin: ["http://localhost:5173", config.FRONTEND_URL],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"], // Explicitly allow Authorization header
        credentials: true,
    }
));
app.use(morgan("dev"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use("/api/dashboard", dashboardRoutes); // Change this line

app.get("/", (req, res) => {
    res.send("Dashboard Service is running");
});


// Export the Express app directly for listening on HTTP
export default app;



