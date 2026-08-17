import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const authMiddleware = (req, res, next) => {
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers?.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized: No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid token",
    });
  }
};