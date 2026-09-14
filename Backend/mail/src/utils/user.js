import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const fetchUserDetails = async (userId) => {
  try {
    if (!userId) return null;

    // Generate internal JWT token
    const token = jwt.sign({ service: 'mail' }, config.INTERNAL_AUTH_TOKEN_SECRET, { expiresIn: '1m' });

    // Call auth service
    const response = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/internal/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.user;
  } catch (error) {
    console.error(`[Mail Service] Failed to fetch user details for ${userId}:`, error.message);
    return null;
  }
};

