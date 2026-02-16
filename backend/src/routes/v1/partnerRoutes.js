/**
 * src/routes/v1/partnerRoutes.js — Versioned partner API: /api/v1/partner
 */
import express from "express";
import {
  getProfile,
  updateProfile,
  uploadShopImage,
  getMyPayouts,
  getEarningsSummary,
  createPayoutRequest,
  getCheckouts,
  getScanStats,
  getRecentRedemptions,
} from "../../controllers/partnerController.js";
import { protect } from "../../middleware/auth.js";
import { partnerOnly } from "../../middleware/role.js";

const router = express.Router();
router.use(protect, partnerOnly);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.post("/upload-image", uploadShopImage);
router.get("/payouts", getMyPayouts);
router.get("/earnings", getEarningsSummary);
router.post("/payout-requests", createPayoutRequest);
router.get("/checkouts", getCheckouts);
router.get("/scan-stats", getScanStats);
router.get("/recent-redemptions", getRecentRedemptions);

export default router;
