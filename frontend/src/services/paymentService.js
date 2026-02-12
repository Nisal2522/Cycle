/**
 * services/paymentService.js
 * --------------------------------------------------
 * Stripe checkout: create session, confirm session (success callback).
 */

import axios from "axios";

const BASE = import.meta.env.VITE_API_URL ?? "";

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Create checkout session; returns { url, sessionId }. Redirect user to url. */
export async function createCheckoutSession(token) {
  const { data } = await axios.post(
    `${BASE}/api/payments/create-checkout-session`,
    {},
    authHeader(token)
  );
  return data;
}

/** Confirm payment after success redirect (saves to DB if webhook didn't). */
export async function confirmSession(token, sessionId) {
  const { data } = await axios.post(
    `${BASE}/api/payments/confirm-session`,
    { sessionId },
    authHeader(token)
  );
  return data;
}
