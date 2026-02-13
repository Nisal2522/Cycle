/**
 * services/partnerService.js
 * --------------------------------------------------
 * Axios-based API service for partner dashboards.
 *
 *  - getPartnerProfile(token)
 *  - updatePartnerProfile(token, payload)
 *  - uploadShopImage(token, base64DataUri)
 *  - getPartnerRewards(token, partnerId)
 *  - createReward(token, payload)
 *  - updateReward(token, rewardId, payload)
 *  - deleteReward(token, rewardId)
 *  - redeemTokens(token, { cyclistId, tokens })
 * --------------------------------------------------
 */

import axios from "axios";

// Use VITE_API_URL from .env, or /api (Vite proxy in dev / same-origin in prod)
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getPartnerProfile(token) {
  const { data } = await axios.get(`${API_BASE}/partner/profile`, authHeader(token));
  return data;
}

export async function updatePartnerProfile(token, payload) {
  const { data } = await axios.patch(
    `${API_BASE}/partner/profile`,
    payload,
    authHeader(token)
  );
  return data;
}

export async function uploadShopImage(token, base64DataUri) {
  const { data } = await axios.post(
    `${API_BASE}/partner/upload-image`,
    { image: base64DataUri },
    authHeader(token)
  );
  return data;
}

export async function getPartnerRewards(token, partnerId) {
  const { data } = await axios.get(
    `${API_BASE}/rewards/partner/${partnerId}`,
    authHeader(token)
  );
  return data;
}

export async function createReward(token, payload) {
  const { data } = await axios.post(
    `${API_BASE}/rewards`,
    payload,
    authHeader(token)
  );
  return data;
}

export async function updateReward(token, rewardId, payload) {
  const { data } = await axios.patch(
    `${API_BASE}/rewards/${rewardId}`,
    payload,
    authHeader(token)
  );
  return data;
}

export async function deleteReward(token, rewardId) {
  const { data } = await axios.delete(
    `${API_BASE}/rewards/${rewardId}`,
    authHeader(token)
  );
  return data;
}

export async function redeemTokens(token, { cyclistId, tokens }) {
  const { data } = await axios.patch(
    `${API_BASE}/tokens/redeem`,
    { cyclistId, tokens },
    authHeader(token)
  );
  return data;
}

export async function getMyPayouts(token) {
  const { data } = await axios.get(`${API_BASE}/partner/payouts`, authHeader(token));
  return data;
}

/** Partner earnings summary: available balance, payouts, payout requests */
export async function getPartnerEarnings(token) {
  const { data } = await axios.get(`${API_BASE}/partner/earnings`, authHeader(token));
  return data;
}

/** Create a payout request for the current partner */
export async function createPayoutRequest(token, amount) {
  const { data } = await axios.post(
    `${API_BASE}/partner/payout-requests`,
    { amount },
    authHeader(token)
  );
  return data;
}

