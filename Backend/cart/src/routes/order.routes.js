import express from "express";
import { getMyOrders, createOrder, payForOrder, shipOrder, getSoldOrders, getOrderById, confirmDelivery } from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { internalAuthMiddleware } from "../middlewares/internalAuth.middleware.js";

const router = express.Router();

// This endpoint is called by the frontend dashboard to show the user their orders
router.get("/my-orders", authMiddleware, getMyOrders);

// This endpoint is called by the frontend dashboard to show the seller their sold items
router.get("/sold", authMiddleware, getSoldOrders);

// This endpoint is called by the frontend to add a won auction to the "cart" (creates an order with pending_payment status)
router.post("/", authMiddleware, createOrder);

// This endpoint gets a single order by its ID
router.get("/:orderId", authMiddleware, getOrderById);

// This endpoint is called INTERNALLY by the payment service to confirm payment.
router.post("/:orderId/pay", internalAuthMiddleware, payForOrder);

// DEMO ONLY: This endpoint simulates a seller shipping the item
router.post("/:orderId/ship", authMiddleware, shipOrder);

// This endpoint allows the buyer to confirm they have received the item
router.post("/:orderId/deliver", authMiddleware, confirmDelivery);

export default router;