import mongoose from "mongoose";
import wishlistModel from "../models/wishlist.model.js";
import { fetchAuctionSnapshot } from "../utils/proxy.utils.js";

/**
 * Fetches the user's wishlist items with live populated auction prices and status.
 * Updates snapshots on read to prevent data stagnation.
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

  if (!items || items.length === 0) {
    return [];
  }

  const updates = [];
  const wishlist = await Promise.all(
    items.map(async (item) => {
      try {
        const liveSnapshot = await fetchAuctionSnapshot(item.auctionId);
        if (liveSnapshot) {
          if (item._id) {
            updates.push({
              updateOne: {
                filter: { _id: item._id },
                update: { $set: { snapshot: liveSnapshot } },
              },
            });
          }
          return {
            _id: String(item.auctionId),
            ...item.snapshot,
            ...liveSnapshot,
          };
        }
      } catch (err) {
        // Fallback to stored snapshot if live auction fetch fails
      }

      return {
        _id: String(item.auctionId),
        ...item.snapshot,
      };
    })
  );

  if (updates.length > 0 && typeof wishlistModel.bulkWrite === "function") {
    wishlistModel.bulkWrite(updates).catch((err) =>
      console.error("Failed to update wishlist snapshots on read:", err.message)
    );
  }

  return wishlist;
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

