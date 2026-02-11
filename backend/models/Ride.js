/**
 * models/Ride.js
 * --------------------------------------------------
 * A single completed ride by a cyclist.
 * Used for Trip History list and period summaries.
 */

import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    cyclistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startLocation: {
      type: String,
      trim: true,
      default: "—",
      maxlength: [200, "Start location must be under 200 characters"],
    },
    endLocation: {
      type: String,
      trim: true,
      default: "—",
      maxlength: [200, "End location must be under 200 characters"],
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
    durationMinutes: {
      type: Number,
      min: 0,
      default: null,
    },
    durationText: {
      type: String,
      trim: true,
      default: "",
      maxlength: [30, "Duration text must be under 30 characters"],
    },
    tokensEarned: {
      type: Number,
      required: true,
      min: 0,
    },
    co2Saved: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

rideSchema.index({ cyclistId: 1, createdAt: -1 });

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
