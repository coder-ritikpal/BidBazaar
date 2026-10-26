import * as authService from "../services/auth.service.js";
import { toUserResponse } from "../utils/user.utils.js";
import config from "../config/config.js";

const FRONTEND_URL = config.FRONTEND_URL;

// Re-export toUserResponse for any legacy or internal references
export { toUserResponse };

export const registerUser = async (req, res) => {
  try {
    const firstName = req.body?.fullName?.firstName;
    const lastName = req.body?.fullName?.lastName;
    const { email, password } = req.body;

    const result = await authService.registerUser({
      firstName,
      lastName,
      email,
      password,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const googleAuthCallback = async (req, res) => {
  try {
    const redirectUrl = await authService.handleGoogleAuthCallback(req.user);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in Google auth callback:", error);
    return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
};

export const exchangeGoogleCode = async (req, res) => {
  try {
    const { code } = req.body;
    const result = await authService.exchangeGoogleCode(code);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error exchanging Google code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      message: "User logged in successfully",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

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
    // The dashboard BFF handles clearing its own cookie. No further action needed here.
    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await authService.getUserPublicProfile(userId);
    return res.status(200).json({ user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error fetching public user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getInternalUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await authService.getInternalUserDetails(userId);
    return res.status(200).json({ user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error fetching internal user details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user?.id;
  const updates = req.body;

  try {
    const result = await authService.updateUserProfile(userId, updates);

    if (!result.hasChanges) {
      return res.status(200).json({
        message: "No changes detected",
        user: result.user,
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: result.user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};
