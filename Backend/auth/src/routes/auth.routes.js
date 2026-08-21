import express from 'express';
import passport from 'passport'; 
import {
  registerUser,
  loginUser,
  logoutUser,
  googleAuthCallback,
  getMe, // Import the new getMe function
  getUserPublicProfile,
  updateProfile,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js'; 
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { registerUserValidationRules } from '../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/register', authLimiter, registerUserValidationRules, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', authLimiter, logoutUser);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));
router.get('/google/callback', passport.authenticate('google',{session: false,failureRedirect: '/login' }), googleAuthCallback);

router.get('/me', protect, getMe); // Protected route to get current user details
router.put('/me', protect, updateProfile); // Protected route to update current user details
router.get('/users/:userId', getUserPublicProfile); // Public route (name only)

export default router;
