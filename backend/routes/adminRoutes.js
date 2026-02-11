/**
 * routes/adminRoutes.js
 * --------------------------------------------------
 * Super Admin API. All routes: protect + adminOnly. JWT required.
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/authMiddleware.js";
import {
  getStats,
  getUsers,
  verifyUser,
  blockUser,
  deleteUser,
  getRoutes,
  deleteRoute,
  getPayouts,
  calculatePayouts,
  processPayout,
  getChartData,
  getUserGrowthStats,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/stats", asyncHandler(getStats));
router.get("/chart-data", asyncHandler(getChartData));
router.get("/user-growth-stats", asyncHandler(getUserGrowthStats));
router.get("/users", asyncHandler(getUsers));
router.patch("/users/:id/verify", asyncHandler(verifyUser));
router.patch("/users/:id/block", asyncHandler(blockUser));
router.delete("/users/:id", asyncHandler(deleteUser));
router.get("/routes", asyncHandler(getRoutes));
router.delete("/routes/:id", asyncHandler(deleteRoute));
router.get("/payouts", asyncHandler(getPayouts));
router.post("/payouts/calculate", asyncHandler(calculatePayouts));
router.post("/payouts/:id/process", asyncHandler(processPayout));

export default router;
