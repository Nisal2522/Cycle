/**
 * services/adminService.js
 * --------------------------------------------------
 * Admin API (JWT required, role admin).
 * Uses same base as other services so Vite proxy or VITE_API_URL works.
 */

import axios from "axios";

// Use same origin in dev (Vite proxy forwards /api to backend). Set VITE_API_URL if backend is elsewhere.
const BASE = import.meta.env.VITE_API_URL ?? "";
const API = `${BASE}/api/admin`;

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getAdminStats(token) {
  const { data } = await axios.get(`${API}/stats`, authHeader(token));
  return data;
}

export async function getAdminChartData(token) {
  const { data } = await axios.get(`${API}/chart-data`, authHeader(token));
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
