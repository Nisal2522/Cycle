/**
 * services/cyclistService.js
 * --------------------------------------------------
 * Axios-based API service for cyclist dashboard data.
 *
 *   getCyclistStats(token)            → GET  /api/cyclist/stats
 *   updateDistance(token, distance)    → POST /api/cyclist/update-distance
 * --------------------------------------------------
 */

import axios from "axios";

const API_URL = "/api/cyclist";

/** Helper — creates auth headers from JWT token */
function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * Fetch the logged-in cyclist's stats.
 */
export async function getCyclistStats(token) {
  const { data } = await axios.get(`${API_URL}/stats`, authHeader(token));
  return data;
}

/**
 * Record a completed ride distance (km).
 * Backend auto-calculates tokens and CO₂ earned.
 * Optional: startLocation, endLocation, duration for trip history.
 */
export async function updateDistance(token, distance, { startLocation, endLocation, duration } = {}) {
  const body = { distance };
  if (startLocation != null) body.startLocation = startLocation;
  if (endLocation != null) body.endLocation = endLocation;
  if (duration != null) body.duration = duration;
  const { data } = await axios.post(
    `${API_URL}/update-distance`,
    body,
    authHeader(token)
  );
  return data;
}

/**
 * Fetch ride history and summary for the logged-in cyclist.
 * @param {string} token - JWT
 * @param {object} params - { period: 'week'|'month'|'3months'|'all', search?: string }
 */
export async function getRides(token, params = {}) {
  const { data } = await axios.get(`${API_URL}/rides`, {
    ...authHeader(token),
    params: { period: params.period || "week", search: params.search || undefined },
  });
  return data;
}

/**
 * Fetch the top 5 cyclists sorted by totalDistance.
 */
export async function getLeaderboard(token) {
  const { data } = await axios.get(
    `${API_URL}/leaderboard`,
    authHeader(token)
  );
  return data;
}

/**
 * Fetch the total number of partner shops (public).
 */
export async function getPartnerCount() {
  const { data } = await axios.get(`${API_URL}/partner-count`);
  return data;   // { count: number }
}

/**
 * Fetch all partner shops with reward preview (public).
 */
export async function getPartnerShops() {
  const { data } = await axios.get(`${API_URL}/partners`);
  return data;
}

/**
 * Fetch all active rewards for a specific partner shop (public).
 */
export async function getShopRewards(partnerId) {
  const { data } = await axios.get(`${API_URL}/partners/${partnerId}/rewards`);
  return data;   // { partner, rewards }
}
