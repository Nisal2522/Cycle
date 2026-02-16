/**
 * src/routes/v1/transactionRoutes.js — Versioned transactions/scanner API: /api/v1/transactions
 */
import express from "express";
import { redeemTokens, confirmRedeem } from "../../controllers/transactionController.js";
import { protect } from "../../middleware/auth.js";
import { partnerOnly } from "../../middleware/role.js";

const router = express.Router();

router.patch("/redeem", protect, partnerOnly, redeemTokens);
router.post("/confirm", protect, partnerOnly, confirmRedeem);

export default router;
