/**
 * models/Payment.js
 * --------------------------------------------------
 * Stripe checkout payments (e.g. Premium Access).
 * Saved on successful checkout (webhook or success callback).
 *
 * Fields:
 *   - userId       : ObjectId → User
 *   - transactionId: Stripe session id or payment_intent id
 *   - amount       : number (LKR)
 *   - currency     : string (e.g. 'lkr')
 *   - status       : 'Success' | 'Pending'
 *   - productName  : string (e.g. 'Cycling Tour Package')
 * --------------------------------------------------
 */

import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "lkr",
      trim: true,
    },
    status: {
      type: String,
      enum: { values: ["Success", "Pending"], message: "Status must be Success or Pending" },
      default: "Success",
    },
    productName: {
      type: String,
      default: "Cycling Tour Package",
      trim: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
