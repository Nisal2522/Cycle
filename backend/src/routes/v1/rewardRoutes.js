/**
 * src/routes/v1/rewardRoutes.js — Versioned rewards API: /api/v1/rewards
 */
import express from "express";
import {
  createReward,
  getPartnerRewards,
  updateReward,
  deleteReward,
} from "../../controllers/rewardController.js";
import { protect } from "../../middleware/auth.js";
import { partnerOnly } from "../../middleware/role.js";

const router = express.Router();

router.route("/").post(protect, partnerOnly, createReward);
router.get("/partner/:id", protect, partnerOnly, getPartnerRewards);
router.route("/:id").patch(protect, partnerOnly, updateReward).delete(protect, partnerOnly, deleteReward);

export default router;
