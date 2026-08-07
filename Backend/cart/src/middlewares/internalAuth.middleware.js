import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const internalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing internal API key.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the INTERNAL secret, not the regular JWT_SECRET
    const decoded = jwt.verify(token, config.INTERNAL_AUTH_TOKEN_SECRET);
    req.user = decoded; // Adds { id, service } to the request
    next();
  } catch (error) {
    console.error('Internal auth error:', error.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid or malformed internal API key.' });
  }
};