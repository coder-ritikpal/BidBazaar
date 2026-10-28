import express from 'express';
import passport from 'passport'; 
import {
  registerUser,
  loginUser,
  logoutUser,
  googleAuthCallback,
  exchangeGoogleCode,
  getMe, // Import the new getMe function
  getUserPublicProfile,
  updateProfile,
  getInternalUserDetails,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js'; 
import { internalAuthMiddleware } from '../middlewares/internalAuth.middleware.js';
import {
  loginLimiter,
  registerLimiter,
  googleExchangeLimiter,
} from '../middlewares/rateLimit.middleware.js';
import { registerUserValidationRules } from '../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/register', registerLimiter, registerUserValidationRules, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser); // No rate limiting — logout should never be blocked

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));
router.get('/google/callback', passport.authenticate('google',{session: false,failureRedirect: '/login' }), googleAuthCallback);
router.post('/google/exchange', googleExchangeLimiter, exchangeGoogleCode); // Rate-limited to prevent code brute-forcing

router.get('/me', protect, getMe); // Protected route to get current user details
router.put('/me', protect, updateProfile); // Protected route to update current user details
router.get('/users/:userId', getUserPublicProfile); // Public route (name only)
router.get('/internal/users/:userId', internalAuthMiddleware, getInternalUserDetails); // Internal route (full details)

export default router;
