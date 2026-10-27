import mongoose from "mongoose";
import wishlistModel from "../models/wishlist.model.js";
import { fetchAuctionSnapshot } from "../utils/proxy.utils.js";

/**
 * Fetches the user's wishlist items.
 */
export const getWishlist = async (userId) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const items = await wishlistModel
    .find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return items.map((item) => ({
    _id: String(item.auctionId),
    ...item.snapshot,
  }));
};

/**
 * Adds an auction to the user's wishlist, taking a fresh snapshot.
 */
export const addToWishlist = async ({ userId, auctionId }) => {
  if (!userId) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    const error = new Error("A valid auctionId is required.");
    error.statusCode = 400;
    throw error;
  }

  let snapshot;
  try {
    snapshot = await fetchAuctionSnapshot(auctionId);
  } catch (cause) {
    const error = new Error("Auction service is unavailable. Please try again.");
    error.statusCode = 503;
    error.cause = cause;
    throw error;
  }

  if (!snapshot) {
    const error = new Error("Auction to add to wishlist not found.");
    error.statusCode = 404;
    throw error;
  }

  try {
    const created = await wishlistModel.create({
      userId,
      auctionId,
      snapshot,
    });

    const createdObj = created.toObject ? created.toObject() : created;
    return {
      isDuplicate: false,
      item: { _id: String(created.auctionId), ...(createdObj.snapshot || {}) },
    };
  } catch (error) {
    if (error?.code === 11000) {
      return { isDuplicate: true };
    }
    throw error;
  }
};

/**
 * Removes an auction from the user's wishlist.
 */
export const removeFromWishlist = async ({ userId, auctionId }) => {
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

  await wishlistModel.findOneAndDelete({ userId, auctionId });
  return true;
};

