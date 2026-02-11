/**
 * models/Redemption.js
 * --------------------------------------------------
 * Logs each token redemption at a partner for monthly payout calculation.
 *
 * Fields:
 *   - partnerId   : ObjectId → User (partner)
 *   - cyclistId   : ObjectId → User (cyclist)
 *   - tokens      : number redeemed
 *   - createdAt   : Date (used for month aggregation)
 * --------------------------------------------------
 */

import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cyclistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokens: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

redemptionSchema.index({ partnerId: 1, createdAt: -1 });

const Redemption = mongoose.model("Redemption", redemptionSchema);
export default Redemption;
