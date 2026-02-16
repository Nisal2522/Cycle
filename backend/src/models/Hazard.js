/**
 * src/models/Hazard.js — Cycling hazard reports (Data Layer).
 */
import mongoose from "mongoose";
import { HAZARD_TYPES } from "../constants.js";

export { HAZARD_TYPES };

const hazardSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    type: {
      type: String,
      enum: { values: HAZARD_TYPES, message: "Invalid hazard type" },
      default: "other",
    },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hazardSchema.index({ lat: 1, lng: 1 });

const Hazard = mongoose.model("Hazard", hazardSchema);
export default Hazard;
