import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import config from '../config/config.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    // 2. Fallback to checking token in cookie (for older flows or specific cases)
    token = req.cookies.token;
  }

  if (!token) {
    console.log("[Auth Service] Protect middleware: No token found in Authorization header or cookie."); // Keep this log for actual missing token
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification failed. Error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};