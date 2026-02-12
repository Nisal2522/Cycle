/**
 * routes/paymentRoutes.js
 * --------------------------------------------------
 * POST /api/payments/create-checkout-session  → protect, createCheckoutSession
 * POST /api/payments/webhook                  → mounted in server.js with raw body
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { createCheckoutSession, confirmSession } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout-session", protect, asyncHandler(createCheckoutSession));
router.post("/confirm-session", protect, asyncHandler(confirmSession));

export default router;
