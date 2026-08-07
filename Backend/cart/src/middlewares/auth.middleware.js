import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // { id: '...', email: '...' }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
