/**
 * routes/authRoutes.js
 * --------------------------------------------------
 * Authentication API routes (MVC: Routes layer).
 *
 * POST /api/auth/register — Create account  → authController.registerUser
 * POST /api/auth/login    — Login & token   → authController.loginUser
 * GET  /api/auth/profile — Get profile     → authController.getProfile
 * --------------------------------------------------
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { registerUser, loginUser, googleLogin, getProfile } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", asyncHandler(registerUser));
router.post("/login", asyncHandler(loginUser));
router.post("/google", asyncHandler(googleLogin));
router.get("/profile", protect, asyncHandler(getProfile));

export default router;
