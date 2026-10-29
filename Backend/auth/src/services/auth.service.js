import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import authCodeModel from "../models/authCode.model.js";
import config from "../config/config.js";
import { publishToQueue } from "../broker/rabbit.js";
import { toUserResponse } from "../utils/user.utils.js";

/**
 * Register a new user with email and password.
 */
export const registerUser = async ({ firstName, lastName, email, password }) => {
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    if (!existingUser.password && existingUser.googleId) {
      const error = new Error("An account with this email already exists via Google. Please log in using 'Sign in with Google'.");
      error.statusCode = 409;
      throw error;
    }
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await userModel.create({
    fullName: {
      firstName,
      lastName,
    },
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ id: newUser._id }, config.JWT_SECRET, {
    expiresIn: "2d",
  });

  try {
    await publishToQueue("user_registration", {
      id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
    });
  } catch (error) {
    console.error("Failed to publish to queue:", error);
  }

  return {
    user: toUserResponse(newUser),
    token,
  };
};

/**
 * Authenticate user with email and password.
 */
export const loginUser = async ({ email, password }) => {
  const user = await userModel.findOne({ email });
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // If the account was registered with Google and has no password set yet
  if (!user.password && user.googleId) {
    const error = new Error("This account was registered using Google. Please log in with Google.");
    error.statusCode = 400;
    throw error;
  }

  if (!user.password) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
    expiresIn: "2d",
  });

  return {
    user: toUserResponse(user),
    token,
  };
};

/**
 * Handle Google OAuth callback and create single-use authorization code.
 */
export const handleGoogleAuthCallback = async (user) => {
  if (!user) {
    return `${config.FRONTEND_URL}/login?error=google_auth_failed`;
  }

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
    expiresIn: "2d",
  });

  const userForRedirect = {
    id: user._id,
    fullName: {
      firstName: user.fullName?.firstName || "",
      lastName: user.fullName?.lastName || "",
    },
    email: user.email,
    googleId: user.googleId,
  };

  const code = crypto.randomUUID();
  await authCodeModel.create({
    code,
    token,
    user: userForRedirect,
    expiresAt: new Date(Date.now() + 60000), // 1 minute expiry
  });

  return `${config.DASHBOARD_SERVICE_URL}/api/dashboard/auth/google/callback?code=${code}`;
};

/**
 * Exchange a single-use Google auth code for the user session token.
 */
export const exchangeGoogleCode = async (code) => {
  if (!code || typeof code !== "string") {
    const error = new Error("Invalid or missing code");
    error.statusCode = 400;
    throw error;
  }

  const authCode = await authCodeModel.findOneAndDelete({ code });
  if (!authCode || authCode.expiresAt < new Date()) {
    const error = new Error("Invalid or expired code");
    error.statusCode = 400;
    throw error;
  }

  return {
    token: authCode.token,
    user: authCode.user,
  };
};

/**
 * Fetch public profile (fullName only) by user ID.
 */
export const getUserPublicProfile = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID format.");
    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findById(userId).select("fullName").lean();
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: userId,
    fullName: user.fullName || null,
  };
};

/**
 * Fetch internal user details for service-to-service communication.
 */
export const getInternalUserDetails = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID format.");
    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findById(userId).lean();
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: userId,
    email: user.email,
    fullName: user.fullName || null,
  };
};

/**
 * Update authenticated user profile fields.
 */
export const updateUserProfile = async (userId, updates) => {
  if (!userId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const user = await userModel.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const allowedUpdates = [
    "firstName",
    "lastName",
    "phoneNumber",
    "address",
    "city",
    "state",
    "zipCode",
    "country",
  ];

  let hasChanges = false;
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      if (key === "firstName" || key === "lastName") {
        if (!user.fullName) user.fullName = {};
        if (user.fullName[key] !== updates[key]) {
          user.fullName[key] = updates[key];
          hasChanges = true;
        }
      } else {
        if (user[key] !== updates[key]) {
          user[key] = updates[key];
          hasChanges = true;
        }
      }
    }
  }

  if (!hasChanges) {
    return {
      hasChanges: false,
      user: user.toObject({ getters: true }),
    };
  }

  const updatedUser = await user.save();
  return {
    hasChanges: true,
    user: toUserResponse(updatedUser),
  };
};

