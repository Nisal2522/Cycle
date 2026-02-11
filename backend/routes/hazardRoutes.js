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
import {
  getHazards,
  getHazardMarkers,
  reportHazard,
  updateHazard,
  deleteHazard,
} from "../controllers/hazardController.js";

const router = express.Router();

router.get("/", asyncHandler(getHazards));
router.get("/markers", asyncHandler(getHazardMarkers));
router.post("/report", protect, asyncHandler(reportHazard));
router.patch("/:id", protect, asyncHandler(updateHazard));
router.delete("/:id", protect, asyncHandler(deleteHazard));

export default router;
