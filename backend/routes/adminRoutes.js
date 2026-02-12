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
  getApprovedRoutes,
  deleteRoute,
  getPendingRoutes,
  approveRoute,
  rejectRoute,
  getPayouts,
  calculatePayouts,
  processPayout,
  getUserGrowthStats,
  getRouteIssues,
  getAdminHazards,
  resolveAdminHazard,
  deleteAdminHazard,
  getPayments,
  getPayoutRequests,
  approvePayoutRequest,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/stats", asyncHandler(getStats));
router.get("/user-growth-stats", asyncHandler(getUserGrowthStats));
router.get("/users", asyncHandler(getUsers));
router.patch("/users/:id/verify", asyncHandler(verifyUser));
router.patch("/users/:id/block", asyncHandler(blockUser));
router.delete("/users/:id", asyncHandler(deleteUser));
router.get("/routes", asyncHandler(getRoutes));
router.get("/approved-routes", asyncHandler(getApprovedRoutes));
router.get("/route-issues", asyncHandler(getRouteIssues));
router.delete("/routes/:id", asyncHandler(deleteRoute));
router.get("/hazards", asyncHandler(getAdminHazards));
router.patch("/hazards/:id/resolve", asyncHandler(resolveAdminHazard));
router.delete("/hazards/:id", asyncHandler(deleteAdminHazard));
router.get("/pending-routes", asyncHandler(getPendingRoutes));
router.patch("/approve-route/:id", asyncHandler(approveRoute));
router.patch("/reject-route/:id", asyncHandler(rejectRoute));
router.get("/payments", asyncHandler(getPayments));
router.get("/payouts", asyncHandler(getPayouts));
router.post("/payouts/calculate", asyncHandler(calculatePayouts));
router.post("/payouts/:id/process", asyncHandler(processPayout));
// GET /api/admin/payout-requests — list partner payout requests
router.get("/payout-requests", asyncHandler(getPayoutRequests));
router.post("/payout-requests/:id/approve", asyncHandler(approvePayoutRequest));

export default router;
