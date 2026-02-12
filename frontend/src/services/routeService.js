/**
 * services/routeService.js
 * --------------------------------------------------
 * API service for saved routes (community routes).
 *
 *   saveRoute(token, payload)  → POST /api/routes
 *   getRoutes()                → GET  /api/routes
 * --------------------------------------------------
 */

import axios from "axios";

const API_URL = "/api/routes";

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * Save a new route. Payload: { startLocation, endLocation, path, distance, duration?, weatherCondition? }
 */
export async function saveRoute(token, payload) {
  const { data } = await axios.post(API_URL, payload, authHeader(token));
  return data;
}

/**
 * Fetch all public (approved) routes for map / community list.
 */
export async function getRoutes() {
  const { data } = await axios.get(API_URL);
  return data;
}

/**
 * Fetch current user's routes (all statuses) for "My Routes" page with status badges.
 */
export async function getMyRoutes(token) {
  const { data } = await axios.get(`${API_URL}/my-routes`, authHeader(token));
  return data;
}

/**
 * Update a route by ID. Payload: { startLocation?, endLocation?, path?, distance?, duration?, weatherCondition? }
 * Only the creator can update.
 */
export async function updateRoute(token, routeId, payload) {
  const { data } = await axios.patch(`${API_URL}/${routeId}`, payload, authHeader(token));
  return data;
}

/**
 * Delete a route by ID. Only the creator can delete.
 */
export async function deleteRoute(token, routeId) {
  const { data } = await axios.delete(`${API_URL}/${routeId}`, authHeader(token));
  return data;
}
