/**
 * routes/rewardRoutes.js
 * --------------------------------------------------
 * Partner reward management routes.
 *
 * POST   /api/rewards               → createReward
 * GET    /api/rewards/partner/:id   → getPartnerRewards
 * PATCH  /api/rewards/:id           → updateReward
 * DELETE /api/rewards/:id           → deleteReward
 * --------------------------------------------------
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import {
  createReward,
  getPartnerRewards,
  updateReward,
  deleteReward,
} from "../controllers/rewardController.js";

const router = express.Router();

router.post("/", protect, asyncHandler(createReward));
router.get("/partner/:id", protect, asyncHandler(getPartnerRewards));
router.patch("/:id", protect, asyncHandler(updateReward));
router.delete("/:id", protect, asyncHandler(deleteReward));

export default router;

