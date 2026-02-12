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
import { registerUser, loginUser, googleLogin, getPublicStats, getProfile, updateProfile, uploadAvatar } from "../controllers/authController.js";

const router = express.Router();

router.get("/stats", asyncHandler(getPublicStats));
router.post("/register", asyncHandler(registerUser));
router.post("/login", asyncHandler(loginUser));
router.post("/google", asyncHandler(googleLogin));
router.get("/profile", protect, asyncHandler(getProfile));
router.patch("/profile", protect, asyncHandler(updateProfile));
router.post("/upload-avatar", protect, asyncHandler(uploadAvatar));

export default router;
