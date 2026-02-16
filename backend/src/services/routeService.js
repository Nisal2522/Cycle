/**
 * src/services/routeService.js
 * --------------------------------------------------
 * Route business logic. All Route model access here (Controller → Service → Model).
 */

import mongoose from "mongoose";
import Route from "../models/Route.js";
import { ROUTE_STATUS } from "../constants.js";
import { LIMITS } from "../constants.js";

export async function createRoute(creatorId, body) {
  const { startLocation, endLocation, path, distance, duration, weatherCondition } = body;
  const route = await Route.create({
    creatorId: creatorId ? new mongoose.Types.ObjectId(creatorId.toString()) : null,
    startLocation: String(startLocation).trim(),
    endLocation: String(endLocation).trim(),
    path: path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
    distance: String(distance).trim(),
    duration: duration != null ? String(duration).trim() : "",
    weatherCondition: weatherCondition != null ? String(weatherCondition).trim() : "",
  });
  return Route.findById(route._id).populate("creatorId", "name").lean();
}

export async function getPublicRoutes() {
  return Route.find({
    $or: [{ status: ROUTE_STATUS.APPROVED }, { status: { $exists: false } }],
  })
    .populate("creatorId", "name")
    .sort({ createdAt: -1 })
    .lean()
    .limit(LIMITS.ROUTES_PUBLIC);
}

export async function getMyRoutes(creatorId) {
  return Route.find({ creatorId })
    .populate("creatorId", "name")
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateRoute(routeId, userId, body) {
  const route = await Route.findById(routeId);
  if (!route) {
    const err = new Error("Route not found");
    err.statusCode = 404;
    throw err;
  }
  if (route.creatorId.toString() !== userId.toString()) {
    const err = new Error("You can only update routes you created");
    err.statusCode = 403;
    throw err;
  }
  const { startLocation, endLocation, path, distance, duration, weatherCondition } = body;
  const updateBody = {
    startLocation: String(startLocation).trim(),
    endLocation: String(endLocation).trim(),
    path: path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
    distance: String(distance).trim(),
    duration: duration != null ? String(duration).trim() : "",
    weatherCondition: weatherCondition != null ? String(weatherCondition).trim() : "",
  };
  const updated = await Route.findByIdAndUpdate(routeId, updateBody, {
    new: true,
    runValidators: true,
  })
    .populate("creatorId", "name")
    .lean();
  return updated;
}

export async function deleteRoute(routeId, userId) {
  const route = await Route.findById(routeId);
  if (!route) {
    const err = new Error("Route not found");
    err.statusCode = 404;
    throw err;
  }
  if (route.creatorId.toString() !== userId.toString()) {
    const err = new Error("You can only delete routes you created");
    err.statusCode = 403;
    throw err;
  }
  await Route.findByIdAndDelete(routeId);
  return { message: "Route deleted successfully" };
}
