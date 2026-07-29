import productModel from "../models/product.model.js";
import { uploadProductImages } from "../services/imagekit.service.js";
import { createAuctionForProduct, updateAuctionForProduct, deleteAuctionForProduct } from "../services/auction.service.js";
import config from "../config/config.js";
 
const REVIEW_WINDOW_MS = (config.REVIEW_WINDOW_MINUTES || 30) * 60 * 1000;
const MIN_AUCTION_DURATION_MS = (config.MIN_AUCTION_DURATION_MINUTES || 5) * 60 * 1000;

const getSellerId = (req) => req.user?.id || req.user?._id;
const toDurationMs = (duration, unit = "days") => {
  const parsedDuration = Number(duration || 0);
  switch (unit) {
    case "minutes":
      return parsedDuration * 60 * 1000;
    case "hours":
      return parsedDuration * 60 * 60 * 1000;
    default: // days
      return parsedDuration * 24 * 60 * 60 * 1000;
  }
};

const getAuctionEndTime = (product) => {
  const durationInMs = toDurationMs(product.auctionDuration, product.auctionDurationUnit);
  return new Date(new Date(product.startAuctionAt).getTime() + durationInMs);
};

const getAuctionStatus = (product, now = Date.now()) => {
  const reviewEndsAtTime = new Date(product.reviewEndsAt).getTime();
  const startAuctionAtTime = new Date(product.startAuctionAt).getTime();
  const endAuctionAtTime = getAuctionEndTime(product).getTime();

  if (now >= endAuctionAtTime) return "ended";
  if (now >= startAuctionAtTime) return "live";
  if (now >= reviewEndsAtTime) return "upcoming";
  return "under_review";
};

const toProductResponse = (product) => {
  const productObject = product.toObject ? product.toObject() : product;
  return {
    ...productObject,
    status: getAuctionStatus(productObject),
    endAuctionAt: getAuctionEndTime(productObject),
  };
};

const resolveReviewTimeline = (req) => {
  const now = Date.now();
  let startAuctionAt, reviewEndsAt;
  const minStartTime = now + REVIEW_WINDOW_MS;

  if (req.body.startOption === "now") {
    // For 'now', the review window is a fixed duration from creation.
    // The auction starts right after.
    startAuctionAt = new Date(minStartTime);
  } else { // 'later'
    // For 'later', the auction starts at the user's requested time,
    // but no earlier than the end of the minimum review window.
    const requestedStartTime = new Date(req.body.startAuctionAt).getTime();
    startAuctionAt = new Date(Math.max(requestedStartTime, minStartTime));
  }

  // The review/editable period always ends when the auction is set to start.
  reviewEndsAt = startAuctionAt;

  return { reviewEndsAt, startAuctionAt };
};

export const getProducts = async (_req, res) => {
  try {
    await productModel.updateMany(
      {
        reviewStatus: "under_review",
        reviewEndsAt: { $lte: new Date() },
      },
      {
        $set: { reviewStatus: "approved" },
      },
    );

    const products = await productModel
      .find({})
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Products fetched successfully",
      products: products.map(toProductResponse),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await productModel.updateMany(
      {
        sellerId,
        reviewStatus: "under_review",
        reviewEndsAt: { $lte: new Date() },
      },
      {
        $set: { reviewStatus: "approved" },
      },
    );

    const products = await productModel
      .find({ sellerId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Seller products fetched successfully",
      products: products.map(toProductResponse),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch seller products",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await productModel.findOne({
      _id: req.params.productId,
      sellerId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.reviewStatus === "under_review" && product.reviewEndsAt.getTime() <= Date.now()) {
      product.reviewStatus = "approved";
      await product.save();
    }

    res.status(200).json({
      message: "Product fetched successfully",
      product: toProductResponse(product),
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate start time for 'later' option
    if (req.body.startOption === 'later') {
      if (!req.body.startAuctionAt) {
        return res.status(400).json({ message: 'Start time is required when scheduling for later.' });
      }
      if (new Date(req.body.startAuctionAt).getTime() <= Date.now()) {
        return res.status(400).json({ message: 'Scheduled start time must be in the future.' });
      }
    }

    const { reviewEndsAt, startAuctionAt } = resolveReviewTimeline(req);

    if (toDurationMs(req.body.auctionDuration, req.body.auctionDurationUnit) < MIN_AUCTION_DURATION_MS) {
      return res.status(400).json({ message: `Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.` });
    }

    const images = req.files?.length ? await uploadProductImages(req.files) : [];

    if (images.length < 1) {
      return res.status(400).json({ message: "Please upload at least one image." });
    }

    const product = await productModel.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      size: req.body.size,
      sizeUnit: req.body.sizeUnit,
      weight: Number(req.body.weight),
      weightUnit: req.body.weightUnit,
      color: req.body.color,
      material: req.body.material,
      brand: req.body.brand,
      condition: req.body.condition,
      reviewStatus: "under_review",
      reviewEndsAt,
      startAuctionAt,
      auctionDuration: Number(req.body.auctionDuration),
      auctionDurationUnit: req.body.auctionDurationUnit,
      sellerId,
      images,
    });

    console.log('Inventory Service: Product created with _id:', product._id);
    try {
      const auctionResponse = await createAuctionForProduct(product);
      product.auctionId = auctionResponse.auction?._id;
      await product.save();
    } catch (auctionError) {
      await product.deleteOne();
      return res.status(502).json({
        message: "Product review started, but auction creation failed",
        error: auctionError.message,
      });
    }

    res.status(201).json({
      message: "Product created successfully",
      product: toProductResponse(product),
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await productModel.findOne({
      _id: req.params.productId,
      sellerId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (new Date().getTime() >= new Date(product.reviewEndsAt).getTime()) {
      return res.status(403).json({ message: "This item can no longer be modified as its review period has ended." });
    }

    const updateData = {};
    const updatableFields = [
      "title",
      "description",
      "category",
      "size",
      "sizeUnit",
      "color",
      "material",
      "brand",
      "condition",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (req.body.price !== undefined) {
      updateData.price = Number(req.body.price);
    }

    if (req.body.weight !== undefined) {
      updateData.weight = Number(req.body.weight);
    }

    if (req.body.auctionDuration !== undefined) {
      updateData.auctionDuration = Number(req.body.auctionDuration);
    }

    if (req.body.auctionDurationUnit !== undefined) {
      updateData.auctionDurationUnit = req.body.auctionDurationUnit;
    }

    const nextDuration = updateData.auctionDuration ?? product.auctionDuration;
    const nextUnit = updateData.auctionDurationUnit ?? product.auctionDurationUnit;
    if (toDurationMs(nextDuration, nextUnit) < MIN_AUCTION_DURATION_MS) {
      return res.status(400).json({ message: `Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.` });
    }

    let shouldRecalculateReview = false;
    const newStartOption = req.body.startOption;
    const newStartAuctionAt = req.body.startAuctionAt;

    if (newStartOption) {
      // Heuristic to determine if the item was originally 'start now'.
      // It's 'now' if the start time is exactly the review window duration after creation.
      const wasStartNow = (product.startAuctionAt.getTime() - product.createdAt.getTime()) <= (REVIEW_WINDOW_MS + 2000); // 2s buffer for processing delay
      const originalStartOption = wasStartNow ? 'now' : 'later';

      // Recalculate if the user switches the start option type.
      if (newStartOption !== originalStartOption) {
          shouldRecalculateReview = true;
      }
      // Or if they keep 'later' but change the specific time.
      else if (newStartOption === 'later' && newStartAuctionAt) {
        const newTime = new Date(newStartAuctionAt).getTime();
        const oldTime = new Date(product.startAuctionAt).getTime();
        // Compare timestamps rounded to the minute to avoid false positives.
        if (Math.floor(newTime / 60000) !== Math.floor(oldTime / 60000)) {
          shouldRecalculateReview = true;
        }
      }
      // If original and new are both 'now', we do NOT recalculate, preventing review window extension.
    }

    if (shouldRecalculateReview) {
      // If recalculating, we must validate the new time.
      if (req.body.startOption === 'later') {
        if (!req.body.startAuctionAt) {
          return res.status(400).json({ message: 'Start time is required when scheduling for later.' });
        }
        if (new Date(req.body.startAuctionAt).getTime() <= Date.now()) {
          return res.status(400).json({ message: 'Scheduled start time must be in the future.' });
        }
      }

      const { reviewEndsAt, startAuctionAt } = resolveReviewTimeline(req); // This uses req.body.startOption and req.body.startAuctionAt
      updateData.reviewEndsAt = reviewEndsAt;
      updateData.startAuctionAt = startAuctionAt;
      updateData.reviewStatus = "under_review"; // Always reset to under_review if schedule is touched
    }

    if (req.files?.length) {
      updateData.images = await uploadProductImages(req.files);
    }

    if (Object.keys(updateData).length === 0 && !req.files?.length) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    product.set(updateData);
    const updatedProduct = await product.save();

    try {
      if (updatedProduct.auctionId) {
        await updateAuctionForProduct(updatedProduct);
      } else {
        const auctionResponse = await createAuctionForProduct(updatedProduct);
        updatedProduct.auctionId = auctionResponse.auction?._id;
        await updatedProduct.save();
      }
    } catch (auctionError) {
      return res.status(502).json({
        message: "Product updated, but failed to sync with auction service.",
        error: auctionError.message,
      });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: toProductResponse(updatedProduct),
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await productModel.findOne({
      _id: req.params.productId,
      sellerId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (new Date().getTime() >= new Date(product.reviewEndsAt).getTime()) {
      return res.status(403).json({ message: "This item can no longer be deleted as its review period has ended." });
    }

    await product.deleteOne();

    // Delete the corresponding auction in the features service
    if (product.auctionId) {
      try {
        await deleteAuctionForProduct(product.auctionId);
      } catch (auctionError) {
        // Log the error but don't prevent product deletion from succeeding
        console.error(`Inventory Service: Failed to delete auction ${product.auctionId} for product ${product._id}:`, auctionError.message);
      }
    }

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete product",
      error: error.message,
    });
  }
};
