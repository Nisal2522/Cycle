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
import { partnerOnly } from "../middleware/role.js";
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

// 🔒 All partner routes require authentication + partner role
router.use(protect, partnerOnly);

// Optional: health check to verify mount (GET /api/partner returns 200)
router.get("/", (req, res) => res.json({ status: "ok", message: "Partner API" }));

router.get("/profile", asyncHandler(getProfile));
router.patch("/profile", asyncHandler(updateProfile));
router.get("/bank-details", asyncHandler(getBankDetails));
router.put("/bank-details", validate(bankDetailsUpdateSchema), asyncHandler(putBankDetails));
router.delete("/bank-details", asyncHandler(deleteBankDetails));
router.post("/upload-image", asyncHandler(uploadShopImage));
router.get("/payouts", asyncHandler(getMyPayouts));
router.get("/earnings", asyncHandler(getEarningsSummary));
router.get("/checkouts", asyncHandler(getCheckouts));
router.get("/scan-stats", asyncHandler(getScanStats));
router.get("/recent-redemptions", asyncHandler(getRecentRedemptions));
router.post("/payout-requests", asyncHandler(createPayoutRequest));

export default router;
