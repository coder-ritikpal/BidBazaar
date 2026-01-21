import express from "express";
import { registerUser } from "../controllers/auth.controller.js";
import * as validationMiddleware from "../middlewares/validation.middleware.js";

const router = express.Router();

router.post("/register", validationMiddleware.registerUserValidationRules, registerUser);

export default router;
