/**
 * controllers/paymentController.js
 * --------------------------------------------------
 * POST /api/payments/create-checkout-session (protected). Stripe webhook. PayHere notify.
 */
import * as stripeService from "../services/stripeService.js";
import { verifyNotifyPayload } from "../utils/payhereHelper.js";

/**
 * POST /api/payments/create-checkout-session — create session, return url for redirect.
 * Body (optional): { lineItems: [{ name, description?, unit_amount, quantity? }] }
 */
export async function createCheckoutSession(req, res) {
  const userId = req.user?._id;
  if (!userId) {
    res.status(401);
    throw new Error("Not authorized");
  }
  try {
    const lineItems = req.body?.lineItems;
    const result = await stripeService.createCheckoutSession(userId, lineItems);
    return res.json({ url: result.url, sessionId: result.sessionId });
  } catch (err) {
    if (err.type === "StripeError" || (err.message && String(err.message).includes("Stripe"))) {
      console.error("[Stripe] createCheckoutSession:", err.message || err);
    }
    throw err;
  }
}

/**
 * Confirm session after success redirect (fallback when webhook not used).
 */
export async function confirmSession(req, res) {
  const userId = req.user?._id;
  const { sessionId } = req.body || {};
  if (!userId || !sessionId) {
    res.status(400);
    throw new Error("sessionId is required");
  }
  const result = await stripeService.retrieveSessionAndCreateOrUpdatePayment(sessionId, userId);
  res.json(result);
}

/**
 * Stripe webhook: verify signature via service (Requirement iv), then handle event.
 * Uses raw body — must be mounted with express.raw() before express.json().
 */
export async function stripeWebhook(req, res) {
  let event;
  try {
    event = stripeService.verifyWebhookSignature(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    const status = err.statusCode || 400;
    if (status === 503) return res.status(503).send(err.message || "Webhook not configured");
    return res.status(status).send(err.message || "Webhook Error");
  }
  try {
    await stripeService.handleWebhookEvent(event);
    res.status(200).send("ok");
  } catch (err) {
    console.error("Payment save/update failed:", err);
    res.status(500).send("Webhook handler error");
  }
}

/**
 * PayHere notify_url: verify MD5, respond 200.
 */
export async function payhereNotify(req, res) {
  const result = verifyNotifyPayload(req.body || {});
  if (!result.valid) {
    console.error("[PayHere] Notify verification failed:", result.error);
    return res.status(401).json({ success: false, message: result.error || "Invalid signature" });
  }
  console.log("[PayHere] Notify verified:", req.body?.order_id, req.body?.payhere_amount);
  res.status(200).send("OK");
}
