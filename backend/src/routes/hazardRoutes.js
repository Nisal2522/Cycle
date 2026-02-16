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
import { validate } from "../middleware/validate.js";
import { reportHazardSchema, updateHazardSchema } from "../validatons/hazardValidation.js";
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
router.post("/report", protect, validate(reportHazardSchema), asyncHandler(reportHazard));
router.patch("/:id", protect, validate(updateHazardSchema), asyncHandler(updateHazard));
router.delete("/:id", protect, asyncHandler(deleteHazard));

export default router;
