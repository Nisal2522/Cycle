/**
 * routes/routeRoutes.js
 * --------------------------------------------------
 * Saved routes API (MVC: Routes layer).
 *
 * POST   /api/routes     → routeController.createRoute (protected)
 * GET    /api/routes     → routeController.getRoutes (public)
 * PATCH  /api/routes/:id → routeController.updateRoute (protected)
 * DELETE /api/routes/:id → routeController.deleteRoute (protected)
 * --------------------------------------------------
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { createRoute, getRoutes, updateRoute, deleteRoute } from "../controllers/routeController.js";

const router = express.Router();

router.post("/", protect, asyncHandler(createRoute));
router.get("/", asyncHandler(getRoutes));
router.patch("/:id", protect, asyncHandler(updateRoute));
router.delete("/:id", protect, asyncHandler(deleteRoute));

export default router;
