import orderModel from "../models/order.model.js";
import { publishToQueue } from "../broker/publisher.js";
import { fetchAuctionFromService } from "./auctionClient.service.js";

/**
 * Fetches all orders won by the authenticated buyer, backfilling details if needed.
 */
export const getMyOrders = async (userId) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const ordersFromDb = await orderModel
    .find({ winnerId: userId })
    .sort({ createdAt: -1 })
    .lean();

  const orders = await Promise.all(
    ordersFromDb.map(async (order) => {
      if (order.itemDetails && order.itemDetails.title) {
        return order;
      }
      try {
        const auction = await fetchAuctionFromService(order.auctionId);
        const itemDetails = {
          title: auction.title || "Untitled Item",
          image: auction.images?.[0]?.url || null,
        };
        await orderModel.updateOne({ _id: order._id }, { $set: { itemDetails } });
        return { ...order, itemDetails };
      } catch (fetchError) {
        console.error(`Could not backfill details for order ${order._id}:`, fetchError.message);
        return { ...order, itemDetails: { title: "Item details not available", image: null } };
      }
    }),
  );

  return orders;
};

/**
 * Fetches a single order by ID for the authorized buyer or seller.
 */
export const getOrderById = async (orderId, userId) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const order = await orderModel.findById(orderId).lean();
  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.winnerId) !== userId && String(order.sellerId) !== userId) {
    const error = new Error("You are not authorized to view this order.");
    error.statusCode = 403;
    throw error;
  }

  return order;
};

/**
 * Fetches all sold orders for the authenticated seller.
 */
export const getSoldOrders = async (userId) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const soldOrders = await orderModel
    .find({ sellerId: userId, status: { $in: ["paid", "shipped", "delivered"] } })
    .sort({ updatedAt: -1 })
    .lean();

  return soldOrders;
};

/**
 * Manually adds a won auction to the user's cart (creates pending_payment order).
 */
export const createOrder = async ({ auctionId, userId }) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  if (!auctionId) {
    const error = new Error("auctionId is required");
    error.statusCode = 400;
    throw error;
  }

  const existingOrder = await orderModel.findOne({ auctionId });
  if (existingOrder) {
    if (String(existingOrder.winnerId) !== userId) {
      const error = new Error("You are not authorized to access this order.");
      error.statusCode = 403;
      throw error;
    }

    if (existingOrder.status === "cancelled_unpaid") {
      const recoveredOrder = await orderModel.findOneAndUpdate(
        {
          _id: existingOrder._id,
          winnerId: userId,
          status: "cancelled_unpaid",
        },
        {
          $set: {
            status: "pending_payment",
            paymentExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
        { new: true },
      );

      const latestOrder = recoveredOrder || (await orderModel.findById(existingOrder._id));
      return {
        isExisting: true,
        isRecovered: !!recoveredOrder,
        order: latestOrder,
      };
    }

    return {
      isExisting: true,
      isRecovered: false,
      order: existingOrder,
    };
  }

  const auction = await fetchAuctionFromService(auctionId);

  if (auction.status !== "ended") {
    const error = new Error("Can only add ended auctions to cart.");
    error.statusCode = 400;
    throw error;
  }

  if (!auction.winnerId || String(auction.winnerId) !== userId) {
    const error = new Error("You are not the winner of this auction.");
    error.statusCode = 403;
    throw error;
  }

  const newOrder = await orderModel.create({
    auctionId,
    productId: auction.productId,
    sellerId: auction.sellerId,
    winnerId: auction.winnerId,
    amount: auction.currentPrice,
    status: "pending_payment",
    paymentExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    itemDetails: {
      title: auction.title || "Untitled Item",
      image: auction.images?.[0]?.url || null,
    },
  });

  return {
    isExisting: false,
    order: newOrder,
  };
};

/**
 * Auto-creates an order triggered internally by the features service.
 */
export const autoCreateOrder = async ({ auctionId }) => {
  if (!auctionId) {
    const error = new Error("auctionId is required");
    error.statusCode = 400;
    throw error;
  }

  const existingOrder = await orderModel.findOne({ auctionId });
  if (existingOrder) {
    return {
      isExisting: true,
      order: existingOrder,
    };
  }

  const auction = await fetchAuctionFromService(auctionId);

  if (auction.status !== "ended") {
    const error = new Error("Can only create orders for ended auctions.");
    error.statusCode = 400;
    throw error;
  }

  if (!auction.winnerId) {
    const error = new Error("Auction has no winner yet.");
    error.statusCode = 400;
    throw error;
  }

  const newOrder = await orderModel.create({
    auctionId,
    productId: auction.productId,
    sellerId: auction.sellerId,
    winnerId: auction.winnerId,
    amount: auction.currentPrice,
    status: "pending_payment",
    paymentExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    itemDetails: {
      title: auction.title || "Untitled Item",
      image: auction.images?.[0]?.url || null,
    },
  });

  return {
    isExisting: false,
    order: newOrder,
  };
};

/**
 * Marks an order as paid, verified by payment-service.
 */
export const payForOrder = async ({ orderId, userId, service }) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  if (!["payment-service", "payment-service-webhook"].includes(service)) {
    const error = new Error("Only the payment service can confirm payment.");
    error.statusCode = 403;
    throw error;
  }

  const order = await orderModel.findById(orderId);
  if (!order) {
    const error = new Error("Order not found in cart.");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.winnerId) !== userId) {
    const error = new Error("You are not authorized to pay for this item.");
    error.statusCode = 403;
    throw error;
  }

  if (order.status === "paid") {
    return { alreadyPaid: true, order };
  }

  if (!["pending_payment", "cancelled_unpaid"].includes(order.status)) {
    const error = new Error(`This order cannot be paid. Current status: ${order.status.replace("_", " ")}.`);
    error.statusCode = 400;
    throw error;
  }

  const paidOrder = await orderModel.findOneAndUpdate(
    {
      _id: orderId,
      winnerId: userId,
      status: { $in: ["pending_payment", "cancelled_unpaid"] },
    },
    { $set: { status: "paid" } },
    { new: true },
  );

  if (!paidOrder) {
    const latestOrder = await orderModel.findById(orderId);
    if (latestOrder?.status === "paid") {
      return { alreadyPaid: true, order: latestOrder };
    }
    const error = new Error(`This order cannot be paid. Current status: ${latestOrder?.status || "unavailable"}.`);
    error.statusCode = 400;
    throw error;
  }

  try {
    await publishToQueue("order_placed", {
      orderId: paidOrder._id.toString(),
      userId,
      amount: paidOrder.amount,
    });
  } catch (pubErr) {
    console.error("[Cart Service] Failed to publish order_placed event:", pubErr);
  }

  return { alreadyPaid: false, order: paidOrder };
};

/**
 * Marks a paid order as shipped by the seller.
 */
export const shipOrder = async ({ orderId, sellerId, trackingNumber, shippingProvider }) => {
  if (!sellerId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  if (!trackingNumber || !shippingProvider) {
    const error = new Error("Tracking number and shipping provider are required.");
    error.statusCode = 400;
    throw error;
  }

  const order = await orderModel.findById(orderId);
  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.sellerId) !== sellerId) {
    const error = new Error("You are not authorized to ship this order.");
    error.statusCode = 403;
    throw error;
  }

  if (order.status !== "paid") {
    const error = new Error(`Order must be in 'paid' state to be shipped. Current status: ${order.status}`);
    error.statusCode = 400;
    throw error;
  }

  order.status = "shipped";
  order.trackingNumber = trackingNumber;
  order.shippingProvider = shippingProvider;
  order.shippedAt = new Date();
  await order.save();

  return order;
};

/**
 * Confirms delivery by the buyer.
 */
export const confirmDelivery = async ({ orderId, buyerId }) => {
  if (!buyerId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const order = await orderModel.findById(orderId);
  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.winnerId) !== buyerId) {
    const error = new Error("You are not authorized to confirm delivery for this order.");
    error.statusCode = 403;
    throw error;
  }

  if (order.status !== "shipped") {
    const error = new Error(`Order must be in 'shipped' state to confirm delivery. Current status: ${order.status}`);
    error.statusCode = 400;
    throw error;
  }

  order.status = "delivered";
  await order.save();

  try {
    await publishToQueue("delivery_confirmed", {
      orderId: order._id.toString(),
      userId: buyerId,
      sellerId: order.sellerId.toString(),
    });
  } catch (pubErr) {
    console.error("[Cart Service] Failed to publish delivery_confirmed event:", pubErr);
  }

  return order;
};

