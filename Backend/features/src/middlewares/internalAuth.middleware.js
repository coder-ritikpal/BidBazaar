import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const internalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing internal API key.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.INTERNAL_AUTH_TOKEN_SECRET);
    req.user = decoded; // Contains { service: 'inventory-service' }
    next();
  } catch (error) {
    console.error('Internal auth error:', error.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid internal API key.' });
  }
};

