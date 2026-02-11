/**
 * services/hazardService.js
 * --------------------------------------------------
 * Axios-based API service for hazard data.
 * Uses relative URLs so Vite's dev-server proxy forwards to the backend.
 *
 *   getHazards()                          → GET    /api/hazards
 *   getHazardMarkers()                    → GET    /api/hazards/markers
 *   reportHazard(token, hazardData)       → POST   /api/hazards/report
 *   updateHazard(token, id, updates)      → PATCH  /api/hazards/:id
 *   deleteHazard(token, id)               → DELETE /api/hazards/:id
 * --------------------------------------------------
 */

import axios from "axios";

const API_URL = "/api/hazards";

/** Helper — creates auth headers from JWT token */
function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * Fetch all active hazards (public endpoint — full payload).
 */
export async function getHazards() {
  const { data } = await axios.get(API_URL);
  return data;
}

/**
 * Lean marker fetch — only _id, lat, lng, type, reportedBy.
 * Used by the map to render pins with minimal payload.
 */
export async function getHazardMarkers() {
  const { data } = await axios.get(`${API_URL}/markers`);
  return data;
}

/**
 * Report a new hazard at given coordinates.
 * @param {string} token
 * @param {{ lat: number, lng: number, type?: string, description?: string }} hazardData
 */
export async function reportHazard(token, hazardData) {
  const { data } = await axios.post(
    `${API_URL}/report`,
    hazardData,
    authHeader(token)
  );
  return data;
}

/**
 * Update a hazard's type or description (owner only).
 * @param {string} token
 * @param {string} id — Hazard ObjectId
 * @param {{ type?: string, description?: string }} updates
 */
export async function updateHazard(token, id, updates) {
  const { data } = await axios.patch(
    `${API_URL}/${id}`,
    updates,
    authHeader(token)
  );
  return data;
}

/**
 * Delete a hazard report (owner only).
 * @param {string} token
 * @param {string} id — Hazard ObjectId
 */
export async function deleteHazard(token, id) {
  const { data } = await axios.delete(
    `${API_URL}/${id}`,
    authHeader(token)
  );
  return data;
}
