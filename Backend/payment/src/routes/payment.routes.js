import express from "express";
import { createOrder, verifyPayment, razorpayWebhook } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/webhook", razorpayWebhook);

export default router;
