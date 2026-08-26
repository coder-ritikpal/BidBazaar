import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { publishToQueue } from "../broker/rabbit.js";
import mongoose from "mongoose";

const FRONTEND_URL = config.FRONTEND_URL;

const toUserResponse = (user) => {
  if (!user) return null;
  // Ensure we have a plain object to work with, not a Mongoose doc
  const userObject = user.toObject ? user.toObject() : user;
  return {
    id: userObject._id,
    fullName: {
      firstName: userObject.fullName?.firstName || '',
      lastName: userObject.fullName?.lastName || '',
    },
    email: userObject.email,
    googleId: userObject.googleId || null,
    phoneNumber: userObject.phoneNumber || null,
    address: userObject.address || null,
    city: userObject.city || null,
    state: userObject.state || null,
    zipCode: userObject.zipCode || null,
    country: userObject.country || null,
  };
};

export const registerUser = async (req, res) => {
  try {
    const firstName = req.body?.fullName?.firstName;
    const lastName = req.body?.fullName?.lastName;
    const { email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
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

    return res.status(201).json({
      message: "User registered successfully",
      user: toUserResponse(newUser),
      token, // Return token in body for BFF to handle
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export async function googleAuthCallback(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }

    // Generate JWT for the authenticated user using the _id from the user object
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: "2d",
    });
    const userForRedirect = {
      id: user._id,
      fullName: {
        firstName: user.fullName?.firstName || '', // Robustly get firstName
        lastName: user.fullName?.lastName || '',   // Robustly get lastName
      },
      email: user.email,
      googleId: user.googleId
    };

    // Redirect back to the dashboard service with the token as a query parameter
    return res.redirect(`https://bidbazaar-dashboard.onrender.com/api/dashboard/auth/google/callback?token=${token}&user=${JSON.stringify(userForRedirect)}`);
  } catch (error) {
    console.error("Error in Google auth callback:", error);
    return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If user has no password (e.g., Google user), they cannot log in with email/password
    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: "2d",
    });

    return res.status(200).json({
      message: "User logged in successfully",
      user: toUserResponse(user),
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Return the user data, including googleId if it exists
    return res.status(200).json({
      user: toUserResponse(req.user),
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // The dashboard BFF will handle clearing its own cookie. No action needed here.
    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const user = await userModel.findById(userId).select("fullName").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      user: {
        id: userId,
        fullName: user.fullName || null,
      },
    });
  } catch (error) {
    console.error("Error fetching public user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user?.id;
  const updates = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Whitelist of fields that are allowed to be updated
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'address', 'city', 'state', 'zipCode', 'country'];

    let hasChanges = false;
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) { // Check if the field is present in the request body
        // Handle nested fullName fields
        if (key === 'firstName' || key === 'lastName') { 
          // Ensure fullName object exists before accessing its properties
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
      return res.status(200).json({ message: "No changes detected", user: user.toObject({ getters: true }) });
    }

    const updatedUser = await user.save();

    res.status(200).json({ message: "Profile updated successfully", user: toUserResponse(updatedUser) });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
