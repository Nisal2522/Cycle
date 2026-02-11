/**
 * models/Route.js
 * --------------------------------------------------
 * Mongoose schema for saved cycling routes (shared with community).
 *
 * Fields:
 *   - creatorId       : ObjectId → User who created the route
 *   - startLocation   : String (display name)
 *   - endLocation      : String (display name)
 *   - path             : Array of { lat, lng }
 *   - distance         : String (e.g. "5.2 km")
 *   - duration         : String (e.g. "18 min")
 *   - weatherCondition : String (e.g. "Clear, 28°C")
 *   - createdAt        : Date
 * --------------------------------------------------
 */

import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startLocation: {
      type: String,
      required: [true, "Start location is required"],
      trim: true,
      maxlength: [200, "Start location must be under 200 characters"],
    },
    endLocation: {
      type: String,
      required: [true, "End location is required"],
      trim: true,
      maxlength: [200, "End location must be under 200 characters"],
    },
    path: {
      type: [
        {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        },
      ],
      default: [],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 2;
        },
        message: "Path must have at least 2 points",
      },
    },
    distance: {
      type: String,
      required: [true, "Distance is required"],
      trim: true,
      maxlength: [20, "Distance must be under 20 characters"],
    },
    duration: {
      type: String,
      trim: true,
      default: "",
      maxlength: [30, "Duration must be under 30 characters"],
    },
    weatherCondition: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Weather condition must be under 120 characters"],
    },
  },
  { timestamps: true }
);

routeSchema.index({ creatorId: 1, createdAt: -1 });

const Route = mongoose.model("Route", routeSchema);
export default Route;
