/**
 * src/services/hazardService.js
 * --------------------------------------------------
 * Hazard business logic. All Hazard model access here (Controller → Service → Model).
 */

import Hazard from "../models/Hazard.js";
import { HAZARD_TYPES } from "../constants.js";
import { LIMITS } from "../constants.js";

export async function getHazards() {
  return Hazard.find({ active: true })
    .select("lat lng type description reportedBy createdAt")
    .populate("reportedBy", "name")
    .sort({ createdAt: -1 })
    .limit(LIMITS.HAZARDS_LIST);
}

export async function getHazardMarkers() {
  return Hazard.find({ active: true })
    .select("lat lng type description reportedBy")
    .populate("reportedBy", "name")
    .sort({ createdAt: -1 })
    .lean()
    .limit(LIMITS.HAZARDS_LIST);
}

export async function reportHazard(userId, body) {
  const { lat, lng } = body;
  const type = (body.type ?? body.category ?? "other").toString().trim() || "other";
  const description = (body.description != null ? String(body.description) : "").trim();
  const safeType = HAZARD_TYPES.includes(type) ? type : "other";
  const hazard = await Hazard.create({
    lat: Number(lat),
    lng: Number(lng),
    type: safeType,
    description,
    reportedBy: userId,
  });
  await hazard.populate("reportedBy", "name");
  return hazard;
}

export async function updateHazard(hazardId, userId, body) {
  const hazard = await Hazard.findById(hazardId);
  if (!hazard) {
    const err = new Error("Hazard not found");
    err.statusCode = 404;
    throw err;
  }
  if (hazard.reportedBy.toString() !== userId.toString()) {
    const err = new Error("You can only edit hazards you reported");
    err.statusCode = 403;
    throw err;
  }
  const { type, description } = body;
  if (type) hazard.type = type;
  if (description !== undefined) hazard.description = description;
  await hazard.save();
  await hazard.populate("reportedBy", "name");
  return hazard;
}

export async function deleteHazard(hazardId, userId) {
  const hazard = await Hazard.findById(hazardId);
  if (!hazard) {
    const err = new Error("Hazard not found");
    err.statusCode = 404;
    throw err;
  }
  if (hazard.reportedBy.toString() !== userId.toString()) {
    const err = new Error("You can only delete hazards you reported");
    err.statusCode = 403;
    throw err;
  }
  await hazard.deleteOne();
  return { message: "Hazard deleted successfully", _id: hazardId };
}
