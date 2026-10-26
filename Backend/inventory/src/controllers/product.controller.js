import * as productService from "../services/product.service.js";
import { toProductResponse } from "../utils/product.utils.js";

// Re-export toProductResponse for any legacy or external references
export { toProductResponse };

const getSellerId = (req) => req.user?.id || req.user?._id;

export const getProducts = async (_req, res) => {
  try {
    const products = await productService.getProducts();
    res.status(200).json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const products = await productService.getSellerProducts(sellerId);

    res.status(200).json({
      message: "Seller products fetched successfully",
      products,
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({
      message: "Failed to fetch seller products",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const product = await productService.getProductById(req.params.productId, sellerId);

    res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(400).json({
      message: "Failed to fetch product",
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const product = await productService.createProduct({
      sellerId,
      body: req.body,
      files: req.files,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.statusCode === 502) {
      return res.status(502).json({
        message: error.message,
        error: error.details,
      });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(400).json({
      message: "Failed to create product",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const product = await productService.updateProduct({
      productId: req.params.productId,
      sellerId,
      body: req.body,
      files: req.files,
    });

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error.statusCode === 502) {
      return res.status(502).json({
        message: error.message,
        error: error.details,
      });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(400).json({
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    await productService.deleteProduct({
      productId: req.params.productId,
      sellerId,
    });

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(400).json({
      message: "Failed to delete product",
    });
  }
};
