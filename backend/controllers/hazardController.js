/**
 * controllers/hazardController.js
 * --------------------------------------------------
 * MVC Controller: Hazard reporting CRUD logic.
 * Used by routes/hazardRoutes.js.
 *
 * - getHazards   — GET    /api/hazards
 * - reportHazard — POST   /api/hazards/report
 * - updateHazard — PATCH  /api/hazards/:id
 * - deleteHazard — DELETE /api/hazards/:id
 * --------------------------------------------------
 */

import Hazard from "../models/Hazard.js";

/**
 * @desc    Get all active hazard markers
 * @access  Public
 */
export async function getHazards(req, res) {
  const hazards = await Hazard.find({ active: true })
    .select("lat lng type description reportedBy createdAt")
    .populate("reportedBy", "name")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json(hazards);
}

/**
 * @desc    Lean marker endpoint — returns only fields needed to render map pins
 *          and their popups. Uses .lean() for faster serialisation.
 * @access  Public
 */
export async function getHazardMarkers(req, res) {
  const markers = await Hazard.find({ active: true })
    .select("lat lng type description reportedBy")
    .populate("reportedBy", "name")
    .sort({ createdAt: -1 })
    .lean()
    .limit(200);

  console.log(`[hazards/markers] Returning ${markers.length} hazard marker(s)`);
  res.json(markers);
}

/**
 * @desc    Report a new hazard at given coordinates
 * @body    { lat, lng, type?, description? }
 * @access  Private
 */
export async function reportHazard(req, res) {
  const { lat, lng, type, description } = req.body;

  if (lat == null || lng == null) {
    res.status(400);
    throw new Error("Latitude and longitude are required");
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400);
    throw new Error("Invalid coordinates");
  }

  const hazard = await Hazard.create({
    lat,
    lng,
    type: type || "other",
    description: description || "",
    reportedBy: req.user._id,
  });

  await hazard.populate("reportedBy", "name");
  res.status(201).json(hazard);
}

/**
 * @desc    Update hazard type/description (owner only)
 * @body    { type?, description? }
 * @access  Private
 */
export async function updateHazard(req, res) {
  const hazard = await Hazard.findById(req.params.id);

  if (!hazard) {
    res.status(404);
    throw new Error("Hazard not found");
  }

  if (hazard.reportedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit hazards you reported");
  }

  const { type, description } = req.body;
  if (type) hazard.type = type;
  if (description !== undefined) hazard.description = description;

  await hazard.save();
  await hazard.populate("reportedBy", "name");
  res.json(hazard);
}

/**
 * @desc    Delete a hazard report (owner only)
 * @access  Private
 */
export async function deleteHazard(req, res) {
  const hazard = await Hazard.findById(req.params.id);

  if (!hazard) {
    res.status(404);
    throw new Error("Hazard not found");
  }

  if (hazard.reportedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete hazards you reported");
  }

  await hazard.deleteOne();
  res.json({ message: "Hazard deleted successfully", _id: req.params.id });
}
