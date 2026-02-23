/**
 * routes/tokenRoutes.js
 * --------------------------------------------------
 * Token-related routes (currently partner redemption).
 *
 * PATCH /api/tokens/redeem → redeemTokens
 * --------------------------------------------------
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { redeemTokens } from "../controllers/transactionController.js";

const router = express.Router();

router.patch("/redeem", protect, asyncHandler(redeemTokens));

export default router;

