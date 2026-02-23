/**
 * src/middleware/auth.js — JWT authentication (Clean Architecture: token verification only here).
 *
 * - Reads Authorization header (req.get('Authorization') or req.headers.authorization).
 * - Verifies JWT with JWT_SECRET from .env (must match the secret used in generateToken).
 * - User lookup is delegated to authService.getUserById (Single Responsibility).
 */
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import * as authService from "../services/authService.js";

function getAuthHeader(req) {
  return req.get("Authorization") ?? req.headers?.authorization ?? null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = getAuthHeader(req);
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401);
    throw new Error("Not authorized — malformed token");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || !String(secret).trim()) {
    res.status(500);
    throw new Error("Server auth misconfiguration. Please set JWT_SECRET in .env");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.status(401);
      throw new Error("Session expired. Please sign in again.");
    }
    if (err.name === "JsonWebTokenError") {
      res.status(401);
      throw new Error("Not authorized — invalid token");
    }
    throw err;
  }

  const userId = decoded.id ?? decoded._id;
  if (!userId) {
    res.status(401);
    throw new Error("Not authorized — invalid token payload");
  }

  const user = await authService.getUserById(userId);
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
});
