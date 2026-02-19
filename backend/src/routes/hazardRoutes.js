/**
 * routes/hazardRoutes.js
 * --------------------------------------------------
 * Hazard reporting API routes (MVC: Routes layer).
 *
 * GET    /api/hazards         → hazardController.getHazards
 * POST   /api/hazards/report  → hazardController.reportHazard
 * PATCH  /api/hazards/:id     → hazardController.updateHazard
 * DELETE /api/hazards/:id     → hazardController.deleteHazard
 * --------------------------------------------------
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { roleCheck } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";
import { reportHazardSchema, updateHazardSchema, verifyHazardSchema } from "../validatons/hazardValidation.js";
import {
  getHazards,
  getHazardMarkers,
  reportHazard,
  updateHazard,
  deleteHazard,
  verifyHazard,
  getHazardVerifications,
  moderateHazard,
  forceDeleteHazard,
  cleanupStaleHazards,
} from "../controllers/hazardController.js";

const router = express.Router();

router.get("/", asyncHandler(getHazards));
router.get("/markers", asyncHandler(getHazardMarkers));
router.post("/report", protect, validate(reportHazardSchema), asyncHandler(reportHazard));
router.patch("/:id", protect, validate(updateHazardSchema), asyncHandler(updateHazard));
router.delete("/:id", protect, asyncHandler(deleteHazard));

// Community validation routes
router.post("/:id/verify", protect, validate(verifyHazardSchema), asyncHandler(verifyHazard));
router.get("/:id/verifications", asyncHandler(getHazardVerifications));

// Admin moderation routes
router.patch("/:id/moderate", protect, roleCheck(["admin"]), asyncHandler(moderateHazard));
router.delete("/:id/force", protect, roleCheck(["admin"]), asyncHandler(forceDeleteHazard));
router.post("/cleanup", protect, roleCheck(["admin"]), asyncHandler(cleanupStaleHazards));

export default router;
