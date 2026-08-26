import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dashboardRoutes from "./routes/dashboard.routes.js";


const app = express();

app.use(cors(
    {
        origin: "http://localhost:5173", // Explicitly set for HTTP frontend
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



