/**
 * src/routes/v1/authRoutes.js — Versioned auth API: /api/v1/auth
 */
import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  getProfile,
  updateProfile,
  uploadAvatar,
  getPublicStats,
} from "../../controllers/authController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.get("/stats", getPublicStats);

router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.post("/upload-avatar", protect, uploadAvatar);

export default router;
