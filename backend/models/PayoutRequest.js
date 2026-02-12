/**
 * models/PayoutRequest.js
 * --------------------------------------------------
 * Partner-initiated payout requests from available balance.
 *
 * Fields:
 *   - partnerId    : ObjectId → User (partner)
 *   - amount       : number (LKR)
 *   - status       : 'Pending' | 'Paid'
 *   - transactionId: Stripe transfer id or reference when paid
 * --------------------------------------------------
 */

import mongoose from "mongoose";

const payoutRequestSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: { values: ["Pending", "Paid"], message: "Status must be Pending or Paid" },
      default: "Pending",
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

payoutRequestSchema.index({ partnerId: 1, createdAt: -1 });

const PayoutRequest = mongoose.model("PayoutRequest", payoutRequestSchema);
export default PayoutRequest;

