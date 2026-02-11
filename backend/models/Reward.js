/**
 * models/Reward.js
 * --------------------------------------------------
 * Mongoose schema for partner reward offers.
 *
 * Fields:
 *   - partnerId   : ObjectId → User with role \"partner\"
 *   - title       : reward title (e.g. \"10% Off Accessories\")
 *   - description : optional longer text
 *   - tokenCost   : number of Eco-Tokens required to redeem
 *   - expiryDate  : optional Date when reward expires
 *   - active      : soft-delete flag
 * --------------------------------------------------
 */

import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Reward title is required"],
      trim: true,
      maxlength: [80, "Reward title must be under 80 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [240, "Description must be under 240 characters"],
    },
    tokenCost: {
      type: Number,
      required: [true, "Token cost is required"],
      min: [1, "Token cost must be at least 1"],
    },
    expiryDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Reward = mongoose.model("Reward", rewardSchema);

export default Reward;

