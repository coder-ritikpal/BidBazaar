import productModel from "../models/product.model.js";
import { uploadProductImages, deleteProductImages } from "./imagekit.service.js";
import {
  createAuctionForProduct,
  updateAuctionForProduct,
  deleteAuctionForProduct,
} from "./auction.service.js";
import { publishToQueue } from "../broker/rabbit.js";
import config from "../config/config.js";
import {
  REVIEW_WINDOW_MS,
  MIN_AUCTION_DURATION_MS,
  toDurationMs,
  toProductResponse,
  resolveReviewTimeline,
} from "../utils/product.utils.js";

/**
 * Fetch all products, automatically approving reviews that have ended.
 */
export const getProducts = async () => {
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

  return products.map(toProductResponse);
};

/**
 * Fetch all products belonging to a specific seller.
 */
export const getSellerProducts = async (sellerId) => {
  if (!sellerId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
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

  return products.map(toProductResponse);
};

/**
 * Fetch a single product by ID for a seller.
 */
export const getProductById = async (productId, sellerId) => {
  if (!sellerId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const product = await productModel.findOne({
    _id: productId,
    sellerId,
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    product.reviewStatus === "under_review" &&
    product.reviewEndsAt.getTime() <= Date.now()
  ) {
    product.reviewStatus = "approved";
    await product.save();
  }

  return toProductResponse(product);
};

/**
 * Create a new product listing and initiate its associated auction.
 */
export const createProduct = async ({ sellerId, body, files }) => {
  if (!sellerId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  // Validate start time for 'later' option
  if (body.startOption === "later") {
    if (!body.startAuctionAt) {
      const error = new Error("Start time is required when scheduling for later.");
      error.statusCode = 400;
      throw error;
    }
    if (new Date(body.startAuctionAt).getTime() <= Date.now()) {
      const error = new Error("Scheduled start time must be in the future.");
      error.statusCode = 400;
      throw error;
    }
  }

  const { reviewEndsAt, startAuctionAt } = resolveReviewTimeline({
    startOption: body.startOption,
    startAuctionAt: body.startAuctionAt,
  });

  if (
    toDurationMs(body.auctionDuration, body.auctionDurationUnit) <
    MIN_AUCTION_DURATION_MS
  ) {
    const error = new Error(
      `Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const images = files?.length ? await uploadProductImages(files) : [];
  if (images.length < 1) {
    const error = new Error("Please upload at least one image.");
    error.statusCode = 400;
    throw error;
  }

  const product = await productModel.create({
    title: body.title,
    description: body.description,
    price: Number(body.price),
    category: body.category,
    size: body.size,
    sizeUnit: body.sizeUnit,
    weight: Number(body.weight),
    weightUnit: body.weightUnit,
    color: body.color,
    material: body.material,
    brand: body.brand,
    condition: body.condition,
    reviewStatus: "under_review",
    reviewEndsAt,
    startAuctionAt,
    auctionDuration: Number(body.auctionDuration),
    auctionDurationUnit: body.auctionDurationUnit,
    sellerId,
    images,
  });

  console.log("Inventory Service: Product created with _id:", product._id);

  try {
    const auctionResponse = await createAuctionForProduct(product);
    product.auctionId = auctionResponse.auction?._id;
    await product.save();
  } catch (auctionError) {
    await product.deleteOne();
    if (typeof deleteProductImages === "function") {
      try {
        await deleteProductImages(images);
      } catch (deleteError) {
        console.error(
          "Failed to delete product images after auction creation failure:",
          deleteError.message,
        );
      }
    }
    const error = new Error("Product review started, but auction creation failed");
    error.statusCode = 502;
    error.details = "Could not create the auction for this product.";
    throw error;
  }

  publishToQueue("product_listed", {
    sellerId: product.sellerId.toString(),
    title: product.title,
    price: product.price,
  }).catch((err) =>
    console.error("Failed to publish product_listed event:", err),
  );

  return toProductResponse(product);
};

/**
 * Update an existing product during its review period.
 */
export const updateProduct = async ({ productId, sellerId, body, files }) => {
  if (!sellerId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const product = await productModel.findOne({
    _id: productId,
    sellerId,
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (new Date().getTime() >= new Date(product.reviewEndsAt).getTime()) {
    const error = new Error(
      "This item can no longer be modified as its review period has ended.",
    );
    error.statusCode = 403;
    throw error;
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
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  });

  if (body.price !== undefined) {
    updateData.price = Number(body.price);
  }

  if (body.weight !== undefined) {
    updateData.weight = Number(body.weight);
  }

  if (body.auctionDuration !== undefined) {
    updateData.auctionDuration = Number(body.auctionDuration);
  }

  if (body.auctionDurationUnit !== undefined) {
    updateData.auctionDurationUnit = body.auctionDurationUnit;
  }

  const nextDuration = updateData.auctionDuration ?? product.auctionDuration;
  const nextUnit = updateData.auctionDurationUnit ?? product.auctionDurationUnit;
  if (toDurationMs(nextDuration, nextUnit) < MIN_AUCTION_DURATION_MS) {
    const error = new Error(
      `Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.`,
    );
    error.statusCode = 400;
    throw error;
  }

  let shouldRecalculateReview = false;
  const newStartOption = body.startOption;
  const newStartAuctionAt = body.startAuctionAt;

  if (newStartOption) {
    const wasStartNow =
      product.startAuctionAt.getTime() - product.createdAt.getTime() <=
      REVIEW_WINDOW_MS + 2000;
    const originalStartOption = wasStartNow ? "now" : "later";

    if (newStartOption !== originalStartOption) {
      shouldRecalculateReview = true;
    } else if (newStartOption === "later" && newStartAuctionAt) {
      const newTime = new Date(newStartAuctionAt).getTime();
      const oldTime = new Date(product.startAuctionAt).getTime();
      if (Math.floor(newTime / 60000) !== Math.floor(oldTime / 60000)) {
        shouldRecalculateReview = true;
      }
    }
  }

  if (shouldRecalculateReview) {
    if (body.startOption === "later") {
      if (!body.startAuctionAt) {
        const error = new Error("Start time is required when scheduling for later.");
        error.statusCode = 400;
        throw error;
      }
      if (new Date(body.startAuctionAt).getTime() <= Date.now()) {
        const error = new Error("Scheduled start time must be in the future.");
        error.statusCode = 400;
        throw error;
      }
    }

    const { reviewEndsAt, startAuctionAt } = resolveReviewTimeline({
      startOption: body.startOption,
      startAuctionAt: body.startAuctionAt,
    });
    updateData.reviewEndsAt = reviewEndsAt;
    updateData.startAuctionAt = startAuctionAt;
    updateData.reviewStatus = "under_review";
  }

  if (files?.length) {
    updateData.images = await uploadProductImages(files);
  }

  if (Object.keys(updateData).length === 0 && !files?.length) {
    const error = new Error("No valid fields provided for update");
    error.statusCode = 400;
    throw error;
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
    const error = new Error(
      "Product updated, but failed to sync with auction service.",
    );
    error.statusCode = 502;
    error.details = "Could not update the auction for this product.";
    throw error;
  }

  return toProductResponse(updatedProduct);
};

/**
 * Delete a product during its review period.
 */
export const deleteProduct = async ({ productId, sellerId }) => {
  if (!sellerId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const product = await productModel.findOne({
    _id: productId,
    sellerId,
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (new Date().getTime() >= new Date(product.reviewEndsAt).getTime()) {
    const error = new Error(
      "This item can no longer be deleted as its review period has ended.",
    );
    error.statusCode = 403;
    throw error;
  }

  await product.deleteOne();

  if (product.auctionId) {
    try {
      await deleteAuctionForProduct(product.auctionId, sellerId);
    } catch (auctionError) {
      console.error(
        `Inventory Service: Failed to delete auction ${product.auctionId} for product ${product._id}:`,
        auctionError.message,
      );
    }
  }

  publishToQueue("product_deleted", {
    sellerId: product.sellerId.toString(),
    title: product.title,
  }).catch((err) =>
    console.error("Failed to publish product_deleted event:", err),
  );

  return true;
};

