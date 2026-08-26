import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './src/config/config.js';
import paymentRoutes from './src/routes/payment.routes.js';
import { connectToRabbitMQ } from './src/broker/rabbit.js';

const app = express();

// Middleware
app.use(cors({
  origin: [config.FRONTEND_URL, 'http://localhost:3004'], // Allow BFF and Frontend
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// Health check
app.get('/api/payments/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'payment' });
});

// Routes
app.use('/api/payments', paymentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(config.PORT, () => {
  console.log(`Payment service running on port ${config.PORT}`);
});

// Message-broker availability must not prevent HTTP health checks (or payment
// requests) from reaching this service. The broker module retries on failure.
connectToRabbitMQ();
