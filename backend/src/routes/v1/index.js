/**
 * src/routes/v1/index.js — Mounts v1 API under /api/v1
 */
import express from "express";
import authRoutes from "./authRoutes.js";
import partnerRoutes from "./partnerRoutes.js";
import transactionRoutes from "./transactionRoutes.js";
import rewardRoutes from "./rewardRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/partner", partnerRoutes);
router.use("/transactions", transactionRoutes);
router.use("/rewards", rewardRoutes);

export default router;
