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


// Export the Express app directly for listening on HTTP
export default app;


// You might want to add a separate export for the app if other modules need it,
// but for the main entry point, exporting the server is typical.
// For simplicity, we'll assume the main entry point will directly listen to this.
