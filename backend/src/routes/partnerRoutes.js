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
import { validate } from "../middleware/validate.js";
import { bankDetailsUpdateSchema } from "../validatons/partnerValidation.js";
import {
  getProfile,
  updateProfile,
  uploadShopImage,
  getBankDetails,
  putBankDetails,
  deleteBankDetails,
  getMyPayouts,
  getEarningsSummary,
  createPayoutRequest,
  getCheckouts,
  getScanStats,
  getRecentRedemptions,
} from "../controllers/partnerController.js";

const router = express.Router();

// Optional: health check to verify mount (GET /api/partner returns 200)
router.get("/", (req, res) => res.json({ status: "ok", message: "Partner API" }));

router.get("/profile", protect, asyncHandler(getProfile));
router.patch("/profile", protect, asyncHandler(updateProfile));
router.get("/bank-details", protect, asyncHandler(getBankDetails));
router.put("/bank-details", protect, validate(bankDetailsUpdateSchema), asyncHandler(putBankDetails));
router.delete("/bank-details", protect, asyncHandler(deleteBankDetails));
router.post("/upload-image", protect, asyncHandler(uploadShopImage));
router.get("/payouts", protect, asyncHandler(getMyPayouts));
router.get("/earnings", protect, asyncHandler(getEarningsSummary));
router.get("/checkouts", protect, asyncHandler(getCheckouts));
router.get("/scan-stats", protect, asyncHandler(getScanStats));
router.get("/recent-redemptions", protect, asyncHandler(getRecentRedemptions));
router.post("/payout-requests", protect, asyncHandler(createPayoutRequest));

export default router;
