/**
 * controllers/routeController.js
 * --------------------------------------------------
 * MVC Controller: Save and fetch community routes.
 *
 * - createRoute — POST /api/routes (protected)
 * - getRoutes   — GET  /api/routes (public)
 * --------------------------------------------------
 */

import mongoose from "mongoose";
import Route from "../models/Route.js";

/**
 * @desc    Save a new route (created by authenticated user)
 * @body    { startLocation, endLocation, path, distance, duration?, weatherCondition? }
 * @access  Private
 */
export async function createRoute(req, res) {
  const { startLocation, endLocation, path, distance, duration, weatherCondition } = req.body;

  if (!startLocation || !endLocation || !path || !distance) {
    res.status(400);
    throw new Error("startLocation, endLocation, path and distance are required");
  }

  if (!Array.isArray(path) || path.length < 2) {
    res.status(400);
    throw new Error("path must be an array with at least 2 points");
  }

  const creatorId = req.user._id ? new mongoose.Types.ObjectId(req.user._id.toString()) : null;
  if (!creatorId) {
    res.status(401);
    throw new Error("User not found");
  }
  const route = await Route.create({
    creatorId,
    startLocation: String(startLocation).trim(),
    endLocation: String(endLocation).trim(),
    path: path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
    distance: String(distance).trim(),
    duration: duration != null ? String(duration).trim() : "",
    weatherCondition: weatherCondition != null ? String(weatherCondition).trim() : "",
  });

  const populated = await Route.findById(route._id)
    .populate("creatorId", "name")
    .lean();

  res.status(201).json(populated);
}

/**
 * @desc    Get all public routes (approved only), newest first.
 *          This is the list shown to every cyclist on Map (Routes) and used for "View on Map".
 *          When admin approves a route (PATCH /api/admin/approve-route/:id), it appears here.
 * @access  Public — no auth; same response for all users
 */
export async function getRoutes(req, res) {
  const routes = await Route.find({
    $or: [{ status: "approved" }, { status: { $exists: false } }],
  })
    .populate("creatorId", "name")
    .sort({ createdAt: -1 })
    .lean()
    .limit(100);

  res.json(routes);
}

/**
 * @desc    Get current user's routes (all statuses). For "My Routes" page with status badges.
 * @access  Private
 */
export async function getMyRoutes(req, res) {
  const creatorId = req.user._id;
  const routes = await Route.find({ creatorId })
    .populate("creatorId", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.json(routes);
}

/**
 * @desc    Update a route (only by the user who created it).
 *          Accepts the same body as createRoute so the same values are passed.
 *          Uses ID from URL (req.params.id). updatedAt set by Mongoose timestamps.
 * @route   PATCH /api/routes/:id
 * @body    { startLocation, endLocation, path, distance, duration?, weatherCondition? } — same as create
 * @access  Private
 */
export async function updateRoute(req, res) {
  const id = req.params.id;
  const { startLocation, endLocation, path, distance, duration, weatherCondition } = req.body;

  const route = await Route.findById(id);
  if (!route) {
    res.status(404);
    throw new Error("Route not found");
  }

  if (route.creatorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only update routes you created");
  }

  if (!startLocation || !endLocation || !path || !distance) {
    res.status(400);
    throw new Error("startLocation, endLocation, path and distance are required");
  }

  if (!Array.isArray(path) || path.length < 2) {
    res.status(400);
    throw new Error("path must be an array with at least 2 points");
  }

  /* Same field shape and sanitization as createRoute */
  const updateBody = {
    startLocation: String(startLocation).trim(),
    endLocation: String(endLocation).trim(),
    path: path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
    distance: String(distance).trim(),
    duration: duration != null ? String(duration).trim() : "",
    weatherCondition: weatherCondition != null ? String(weatherCondition).trim() : "",
  };

  const updated = await Route.findByIdAndUpdate(id, updateBody, {
    new: true,
    runValidators: true,
  })
    .populate("creatorId", "name")
    .lean();

  res.json(updated);
}

/**
 * @desc    Delete a route (only by the user who created it)
 * @param   :id — route ID
 * @access  Private
 */
export async function deleteRoute(req, res) {
  const { id } = req.params;

  const route = await Route.findById(id);
  if (!route) {
    res.status(404);
    throw new Error("Route not found");
  }

  if (route.creatorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete routes you created");
  }

  await Route.findByIdAndDelete(id);
  res.json({ message: "Route deleted successfully" });
}
