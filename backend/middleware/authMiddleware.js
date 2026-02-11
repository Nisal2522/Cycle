/**
 * middleware/authMiddleware.js
 * --------------------------------------------------
 * Express middleware that protects routes by verifying
 * the JWT token from the Authorization header.
 *
 * Usage:
 *   router.get("/profile", protect, getProfile);
 *
 * The token must be sent as:
 *   Authorization: Bearer <token>
 *
 * On success, attaches the user object (minus password)
 * to req.user and calls next().
 * --------------------------------------------------
 */

import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check for Bearer token in Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — malformed token");
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("Not authorized — user no longer exists");
    }

    if (user.isBlocked) {
      res.status(403);
      throw new Error("Account is blocked. Contact support.");
    }

    req.user = user;
    next();
  } catch (err) {
    // Distinguish between JWT-specific errors
    if (err.name === "TokenExpiredError") {
      res.status(401);
      throw new Error("Session expired. Please sign in again.");
    }
    if (err.name === "JsonWebTokenError") {
      res.status(401);
      throw new Error("Not authorized — invalid token");
    }

    // Re-throw other errors (e.g. our own "user no longer exists")
    throw err;
  }
});

/**
 * Restrict access to admin role only. Use after protect.
 */
const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403);
    throw new Error("Access denied — admin only");
  }
  next();
});

export { protect, adminOnly };
