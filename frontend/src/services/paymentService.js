/**
 * services/paymentService.js
 * --------------------------------------------------
 * Stripe checkout: create session, confirm session (success callback).
 * All API calls go through axiosClient (folder structure alignment).
 */

import { axiosClient } from "./axiosClient.js";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function authHeader(token) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

const paymentsBase = BASE ? `${BASE}/api/payments` : "/api/payments";

/** Create checkout session; returns { url, sessionId }. Body optional: { lineItems: [{ name, description?, unit_amount, quantity? }] }. */
export async function createCheckoutSession(token, body = {}) {
  const { data } = await axiosClient.post(
    `${paymentsBase}/create-checkout-session`,
    body,
    authHeader(token)
  );
  return data;
}

/** Confirm payment after success redirect (saves to DB if webhook didn't). */
export async function confirmSession(token, sessionId) {
  const { data } = await axiosClient.post(
    `${paymentsBase}/confirm-session`,
    { sessionId },
    authHeader(token)
  );
  return data;
}
