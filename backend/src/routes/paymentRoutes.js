/**
 * routes/paymentRoutes.js
 * PayHere notify is mounted in app.js. No Stripe routes.
 */

import express from "express";
import { markPayoutPaid } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/role.js";

const router = express.Router();

// Frontend callback - mark as paid
router.post("/payhere/mark-paid", protect, adminOnly, markPayoutPaid);

export default router;
