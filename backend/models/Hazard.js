/**
 * models/Hazard.js
 * --------------------------------------------------
 * Mongoose schema for cycling hazard reports.
 *
 * Fields:
 *   - lat, lng       : coordinates of the hazard
 *   - type           : pothole | construction | accident | other
 *   - description    : optional text
 *   - reportedBy     : ObjectId → User who reported it
 *   - active         : boolean (can be resolved later)
 *
 * Indexed on coordinates for geo-queries.
 * --------------------------------------------------
 */

import mongoose from "mongoose";

export const HAZARD_TYPES = ["pothole", "construction", "accident", "flooding", "other"];

const hazardSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: [true, "Latitude is required"],
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: [true, "Longitude is required"],
      min: -180,
      max: 180,
    },
    type: {
      type: String,
      enum: { values: HAZARD_TYPES, message: "Invalid hazard type" },
      default: "other",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description must be under 200 characters"],
      default: "",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// Index for efficient geo lookups
hazardSchema.index({ lat: 1, lng: 1 });

const Hazard = mongoose.model("Hazard", hazardSchema);

export default Hazard;
