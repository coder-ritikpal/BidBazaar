import * as orderService from "../services/order.service.js";
import { fetchAuctionFromService } from "../services/auctionClient.service.js";

// Re-export for legacy references or external test scripts
export { fetchAuctionFromService };

export const getMyOrders = async (req, res) => {
  const userId = req.user?.id;
  try {
    const orders = await orderService.getMyOrders(userId);
    return res.status(200).json({ message: "Orders fetched successfully.", orders });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to fetch orders." });
  }
};

export const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id;

  try {
    const order = await orderService.getOrderById(orderId, userId);
    return res.status(200).json({ message: "Order fetched successfully.", order });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to fetch order." });
  }
};

export const getSoldOrders = async (req, res) => {
  const userId = req.user?.id;
  try {
    const orders = await orderService.getSoldOrders(userId);
    return res.status(200).json({ message: "Sold orders fetched successfully.", orders });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to fetch sold orders." });
  }
};

export const createOrder = async (req, res) => {
  const { auctionId } = req.body;
  const userId = req.user?.id;

  try {
    const result = await orderService.createOrder({ auctionId, userId });
    if (result.isExisting) {
      return res.status(200).json({
        message: result.isRecovered ? "Order recovered to cart." : "Item is already in your cart or ordered.",
        order: result.order,
      });
    }

    return res.status(201).json({
      message: "Item added to cart successfully.",
      order: result.order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: "Auction not found." });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to add item to cart." });
  }
};

export const autoCreateOrder = async (req, res) => {
  const { auctionId } = req.body;

  try {
    const result = await orderService.autoCreateOrder({ auctionId });
    if (result.isExisting) {
      return res.status(200).json({
        message: "Order already exists.",
        order: result.order,
      });
    }

    return res.status(201).json({
      message: "Order auto-created successfully.",
      order: result.order,
    });
  } catch (error) {
    console.error("Error auto-creating order:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: "Auction not found." });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to auto-create order." });
  }
};

export const payForOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id;
  const service = req.user?.service;

  try {
    const result = await orderService.payForOrder({ orderId, userId, service });
    if (result.alreadyPaid) {
      return res.status(200).json({ message: "Order is already paid.", order: result.order });
    }

    return res.status(200).json({
      message: "Payment successful! Your order is being processed.",
      order: result.order,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error processing payment:", error);
    return res.status(500).json({ message: "Failed to process payment." });
  }
};

export const shipOrder = async (req, res) => {
  const { orderId } = req.params;
  const { trackingNumber, shippingProvider } = req.body;
  const userId = req.user?.id;

  try {
    const order = await orderService.shipOrder({
      orderId,
      sellerId: userId,
      trackingNumber,
      shippingProvider,
    });

    return res.status(200).json({
      message: "Order marked as shipped.",
      order,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error shipping order:", error);
    return res.status(500).json({ message: "Failed to ship order." });
  }
};

export const confirmDelivery = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id;

  try {
    const order = await orderService.confirmDelivery({
      orderId,
      buyerId: userId,
    });

    return res.status(200).json({
      message: "Delivery confirmed. Thank you!",
      order,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error confirming delivery:", error);
    return res.status(500).json({ message: "Failed to confirm delivery." });
  }
};
