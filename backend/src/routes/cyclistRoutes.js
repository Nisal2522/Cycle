/**
 * routes/cyclistRoutes.js
 * --------------------------------------------------
 * Cyclist dashboard API routes (MVC: Routes layer).
 *
 * GET  /api/cyclist/stats           → cyclistController.getStats
 * POST /api/cyclist/update-distance → cyclistController.updateDistance
 * GET  /api/cyclist/leaderboard     → cyclistController.getLeaderboard
 * --------------------------------------------------
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import {
  getStats,
  updateDistance,
  getLeaderboard,
  getRides,
  getPartnerCount,
  getPartnerShops,
  getShopRewards,
} from "../controllers/cyclistController.js";

const router = express.Router();

// Specific paths first (before any :id or param routes)
router.get("/rides",           protect, asyncHandler(getRides));
router.get("/stats",           protect, asyncHandler(getStats));
router.get("/leaderboard",     protect, asyncHandler(getLeaderboard));
router.get("/partner-count",   asyncHandler(getPartnerCount));
router.get("/partners",        asyncHandler(getPartnerShops));
router.post("/update-distance", protect, asyncHandler(updateDistance));
router.get("/partners/:id/rewards", asyncHandler(getShopRewards));

export default router;
