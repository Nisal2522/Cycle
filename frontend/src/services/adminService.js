/**
 * services/adminService.js
 * --------------------------------------------------
 * Admin API (JWT required, role admin).
 * Uses same base as other services so Vite proxy or VITE_API_URL works.
 */

import axios from "axios";

const BASE = import.meta.env.VITE_API_URL ?? "";
const API = BASE ? `${BASE}/admin` : "/api/admin";

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getAdminStats(token) {
  const { data } = await axios.get(`${API}/stats`, authHeader(token));
  return data;
}

export async function getAdminUserGrowthStats(token, period = "thisYear") {
  const { data } = await axios.get(`${API}/user-growth-stats`, {
    ...authHeader(token),
    params: { period },
  });
  return data;
}

export async function getAdminUsers(token) {
  const { data } = await axios.get(`${API}/users`, authHeader(token));
  return data;
}

export async function verifyUser(token, userId) {
  const { data } = await axios.patch(`${API}/users/${userId}/verify`, {}, authHeader(token));
  return data;
}

export async function blockUser(token, userId, block = true) {
  const { data } = await axios.patch(`${API}/users/${userId}/block`, { block }, authHeader(token));
  return data;
}

export async function deleteUser(token, userId) {
  const { data } = await axios.delete(`${API}/users/${userId}`, authHeader(token));
  return data;
}

export async function getAdminRoutes(token) {
  if (!token) throw new Error("No auth token");
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API}/routes`, config);
  return data;
}

/** Approved routes with path for admin Live Route Overview map */
export async function getApprovedRoutes(token) {
  const { data } = await axios.get(`${API}/approved-routes`, authHeader(token));
  return data;
}

/** Auto-detected route issues for admin map (inaccurate, safety, duplicate, junk) */
export async function getRouteIssues(token) {
  const { data } = await axios.get(`${API}/route-issues`, authHeader(token));
  return data;
}

/** All user-reported hazards for admin map (coordinates, category, reportedBy) */
export async function getAdminHazards(token) {
  const { data } = await axios.get(`${API}/hazards`, authHeader(token));
  return data;
}

/** Mark hazard as resolved (active: false); removes from map */
export async function resolveAdminHazard(token, hazardId) {
  const { data } = await axios.patch(`${API}/hazards/${hazardId}/resolve`, {}, authHeader(token));
  return data;
}

/** Delete any hazard (admin only) */
export async function deleteAdminHazard(token, hazardId) {
  const { data } = await axios.delete(`${API}/hazards/${hazardId}`, authHeader(token));
  return data;
}

export async function getPendingRoutes(token) {
  const { data } = await axios.get(`${API}/pending-routes`, authHeader(token));
  return data;
}

export async function approveRoute(token, routeId) {
  const { data } = await axios.patch(`${API}/approve-route/${routeId}`, {}, authHeader(token));
  return data;
}

export async function rejectRoute(token, routeId) {
  const { data } = await axios.patch(`${API}/reject-route/${routeId}`, {}, authHeader(token));
  return data;
}

export async function deleteAdminRoute(token, routeId) {
  const { data } = await axios.delete(`${API}/routes/${routeId}`, authHeader(token));
  return data;
}

export async function getAdminPayouts(token) {
  const { data } = await axios.get(`${API}/payouts`, authHeader(token));
  return data;
}

export async function calculatePayouts(token, month) {
  const { data } = await axios.post(`${API}/payouts/calculate`, { month }, authHeader(token));
  return data;
}

export async function processPayout(token, payoutId) {
  const { data } = await axios.post(`${API}/payouts/${payoutId}/process`, {}, authHeader(token));
  return data;
}

/** Stripe live transactions (Payments collection) for admin table */
export async function getAdminPayments(token) {
  const { data } = await axios.get(`${API}/payments`, authHeader(token));
  return data;
}

/** Partner payout requests (manual payouts from available balance) */
export async function getPayoutRequests(token) {
  const { data } = await axios.get(`${API}/payout-requests`, authHeader(token));
  return data;
}

export async function approvePayoutRequest(token, requestId) {
  const { data } = await axios.post(
    `${API}/payout-requests/${requestId}/approve`,
    {},
    authHeader(token)
  );
  return data;
}
