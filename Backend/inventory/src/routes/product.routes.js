import express from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, getSellerProducts, updateProduct } from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { createProductValidationRules, updateProductValidationRules } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/seller", authMiddleware, getSellerProducts);
router.get("/:productId", authMiddleware, getProductById);
router.post("/", authMiddleware, upload.array("images", 5), createProductValidationRules, createProduct);
router.put("/:productId", authMiddleware, upload.array("images", 5), updateProductValidationRules, updateProduct);
router.delete("/:productId", authMiddleware, deleteProduct);




export default router;
