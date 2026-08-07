import orderModel from "../models/order.model.js";
import config from "../config/config.js";

/**
 * A robust helper to fetch auction details from the 'features' (auctions) service.
 * @param {string} auctionId - The ID of the auction to fetch.
 * @returns {Promise<object>} The full auction object.
 * @throws {Error} If the auction is not found or if there's a communication/configuration error.
 */
const fetchAuctionFromService = async (auctionId) => {
  if (!auctionId) {
    throw new Error("auctionId is required to fetch auction details.");
  }
  if (!config.AUCTIONS_SERVICE_URL) {
    console.error("[Cart Service] AUCTIONS_SERVICE_URL is not configured.");
    throw new Error("Internal configuration error: Auction service URL is missing.");
  }

  const url = new URL(`/api/auctions/${auctionId}`, config.AUCTIONS_SERVICE_URL);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Auction with ID ${auctionId} not found.`);
      }
      const errorText = await response.text();
      console.error(`Failed to fetch auction ${auctionId}: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch auction details from features service.`);
    }
    const data = await response.json();
    // The auction service nests the auction object under an 'auction' key
    const auction = data?.auction || data;
    if (!auction) {
      throw new Error(`Auction with ID ${auctionId} not found in response payload.`);
    }
    return auction;
  } catch (error) {
    console.error(`Error during fetch for auction ${auctionId}:`, error);
    // Re-throw to be handled by the calling controller function
    throw error;
  }
};

export const getMyOrders = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
    const ordersFromDb = await orderModel.find({ winnerId: userId }).sort({ createdAt: -1 }).lean();

    // The createOrder function now robustly saves itemDetails.
    // This fallback logic is good for migrating old data but can be simplified over time.
    const orders = await Promise.all(
      ordersFromDb.map(async (order) => {
        if (order.itemDetails && order.itemDetails.title) {
          return order;
        }
        // If details are missing, try to fetch and backfill them.
        try {
          const auction = await fetchAuctionFromService(order.auctionId);
          const itemDetails = {
            title: auction.title || "Untitled Item",
            image: auction.images?.[0]?.url || null,
          };
          // Update the order in the DB to prevent future fetches for this item.
          await orderModel.updateOne({ _id: order._id }, { $set: { itemDetails } });
          return { ...order, itemDetails };
        } catch (fetchError) {
          console.error(`Could not backfill details for order ${order._id}:`, fetchError.message);
          return { ...order, itemDetails: { title: 'Item details not available', image: null } };
        }
      })
    );

    res.status(200).json({ message: "Orders fetched successfully.", orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
    const order = await orderModel.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Ensure the user is either the buyer or the seller
    if (String(order.winnerId) !== userId && String(order.sellerId) !== userId) {
      return res.status(403).json({ message: "You are not authorized to view this order." });
    }

    res.status(200).json({ message: "Order fetched successfully.", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order.", error: error.message });
  }
};

export const getSoldOrders = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
    // Find orders where the user is the seller and the order has been paid for or shipped
    const soldOrders = await orderModel
      .find({ sellerId: userId, status: { $in: ['paid', 'shipped', 'delivered'] } })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({ message: "Sold orders fetched successfully.", orders: soldOrders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sold orders.", error: error.message });
  }
};

export const createOrder = async (req, res) => {
  const { auctionId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  if (!auctionId) {
    return res.status(400).json({ message: "auctionId is required" });
  }

  try {
    // Idempotency check: if an order for this auction already exists, return it.
    const existingOrder = await orderModel.findOne({ auctionId });
    if (existingOrder) {
      return res.status(200).json({ message: "Item is already in your cart or ordered.", order: existingOrder });
    }

    // Fetch fresh auction data to verify winner and details
    const auction = await fetchAuctionFromService(auctionId);

    // Verifications
    if (auction.status !== 'ended') {
      return res.status(400).json({ message: "Can only add ended auctions to cart." });
    }
    if (!auction.winnerId || String(auction.winnerId) !== userId) {
      return res.status(403).json({ message: "You are not the winner of this auction." });
    }

    // Create a new order
    const newOrder = await orderModel.create({
      auctionId,
      productId: auction.productId,
      sellerId: auction.sellerId,
      winnerId: auction.winnerId,
      amount: auction.currentPrice,
      status: 'pending_payment', // Item is in cart, awaiting payment
      itemDetails: {
        title: auction.title || 'Untitled Item',
        image: auction.images?.[0]?.url || null,
      },
    });

    res.status(201).json({ message: "Item added to cart successfully.", order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    if (error.message.includes("not found")) {
        return res.status(404).json({ message: "Auction not found." });
    }
    res.status(500).json({ message: "Failed to add item to cart.", error: error.message });
  }
};

export const payForOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found in cart." });
    }
    if (String(order.winnerId) !== userId) {
      return res.status(403).json({ message: "You are not authorized to pay for this item." });
    }
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ message: `This order is not awaiting payment. Current status: ${order.status.replace('_', ' ')}.` });
    }

    // In a real app, this would be triggered by a webhook from the payment service
    order.status = 'paid';
    await order.save();

    res.status(200).json({ message: "Payment successful! Your order is being processed.", order });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Failed to process payment.", error: error.message });
  }
};

export const shipOrder = async (req, res) => {
  const { orderId } = req.params;
  const { trackingNumber, shippingProvider } = req.body;
  const userId = req.user?.id; // This is the seller

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  if (!trackingNumber || !shippingProvider) {
    return res.status(400).json({ message: 'Tracking number and shipping provider are required.' });
  }

  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Security Check: Ensure the person shipping is the seller of the item.
    if (String(order.sellerId) !== userId) {
      return res.status(403).json({ message: "You are not authorized to ship this order." });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ message: `Order must be in 'paid' state to be shipped. Current status: ${order.status}` });
    }

    order.status = 'shipped';
    order.trackingNumber = trackingNumber;
    order.shippingProvider = shippingProvider;
    order.shippedAt = new Date();
    await order.save();

    res.status(200).json({ message: "Order marked as shipped.", order });
  } catch (error) {
    console.error("Error shipping order:", error);
    res.status(500).json({ message: "Failed to ship order.", error: error.message });
  }
};

export const confirmDelivery = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id; // This is the buyer

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Security Check: Ensure the person confirming is the buyer.
    if (String(order.winnerId) !== userId) {
      return res.status(403).json({ message: "You are not authorized to confirm delivery for this order." });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ message: `Order must be in 'shipped' state to confirm delivery. Current status: ${order.status}` });
    }

    order.status = 'delivered';
    await order.save();

    res.status(200).json({ message: "Delivery confirmed. Thank you!", order });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    res.status(500).json({ message: "Failed to confirm delivery.", error: error.message });
  }
};