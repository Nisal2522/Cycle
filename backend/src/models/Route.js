/**
 * src/models/Route.js — Saved cycling routes (Data Layer).
 */
import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startLocation: { type: String, required: true, trim: true, maxlength: 200 },
    endLocation: { type: String, required: true, trim: true, maxlength: 200 },
    path: {
      type: [{ lat: { type: Number, required: true }, lng: { type: Number, required: true } }],
      default: [],
      validate: { validator: (v) => Array.isArray(v) && v.length >= 2, message: "Path must have at least 2 points" },
    },
    distance: { type: String, required: true, trim: true, maxlength: 20 },
    duration: { type: String, trim: true, default: "", maxlength: 30 },
    weatherCondition: { type: String, trim: true, default: "", maxlength: 120 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

routeSchema.index({ status: 1 });
routeSchema.index({ creatorId: 1, createdAt: -1 });

const Route = mongoose.model("Route", routeSchema);
export default Route;
