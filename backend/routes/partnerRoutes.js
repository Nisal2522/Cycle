/**
 * routes/partnerRoutes.js
 * --------------------------------------------------
 * Partner shop profile & image upload.
 *
 * GET   /api/partner/profile       → getProfile
 * PATCH /api/partner/profile       → updateProfile
 * POST  /api/partner/upload-image  → uploadShopImage
 * --------------------------------------------------
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  uploadShopImage,
  getMyPayouts,
  getEarningsSummary,
  createPayoutRequest,
} from "../controllers/partnerController.js";

const router = express.Router();

// Optional: health check to verify mount (GET /api/partner returns 200)
router.get("/", (req, res) => res.json({ status: "ok", message: "Partner API" }));

router.get("/profile", protect, asyncHandler(getProfile));
router.patch("/profile", protect, asyncHandler(updateProfile));
router.post("/upload-image", protect, asyncHandler(uploadShopImage));
router.get("/payouts", protect, asyncHandler(getMyPayouts));
router.get("/earnings", protect, asyncHandler(getEarningsSummary));
router.post("/payout-requests", protect, asyncHandler(createPayoutRequest));

export default router;
