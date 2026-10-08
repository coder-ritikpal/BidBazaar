import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import paymentsRoutes from './routes/payment.routes.js';

const app = express();

// Security headers — must be first
app.use(helmet());

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({
    limit: "16kb",
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Payment Service is running');
});

app.use('/api/payments', paymentsRoutes);

export default app;