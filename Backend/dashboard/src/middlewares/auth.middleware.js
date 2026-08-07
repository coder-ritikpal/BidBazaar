import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const authMiddleware = async (req, res, next) => {
  let token;

  // Expect token in Authorization header from frontend
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log("[Dashboard BFF] Auth Middleware: No token found in Authorization header.");
    return res.status(401).json({ message: 'Not authorized, no token' }); // Keep this log for actual missing token
  }

  try {
    // Verify the token (using the same JWT_SECRET as the auth service)
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Attach user ID to request for downstream services or local use
    // The auth service's protect middleware will fetch full user details if needed.
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error("[Dashboard BFF] Auth Middleware: Token verification failed. Error:", error.message); // Keep this error log
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};