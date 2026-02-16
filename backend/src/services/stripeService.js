/**
 * services/stripeService.js
 * --------------------------------------------------
 * Stripe business logic (Controller-Service-Repository). Requirement ii & iv.
 * Uses STRIPE_SECRET_KEY from env; throws if missing (Requirement v).
 */

import Stripe from "stripe";
import * as paymentRepository from "../repositories/paymentRepository.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const TOUR_PACKAGE_PRICE_LKR = 1500;
const TOUR_PRODUCT_NAME = "Cycling Tour Package";

const stripe = (() => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || String(key).trim() === "") return null;
  return new Stripe(key.trim());
})();

export function isConfigured() {
  return !!stripe;
}

function ensureStripeConfigured() {
  if (!stripe) {
    const err = new Error("Payment gateway is not configured. Set STRIPE_SECRET_KEY in .env");
    err.statusCode = 503;
    throw err;
  }
}

/**
 * Build Stripe line_items from product info. Default: single Cycling Tour Package.
 */
function buildLineItems(lineItems) {
  if (Array.isArray(lineItems) && lineItems.length > 0) {
    return lineItems.map((item) => ({
      price_data: {
        currency: "lkr",
        unit_amount: Number(item.unit_amount) || 0,
        product_data: {
          name: String(item.name || "Item").trim() || "Product",
          description: String(item.description || "").trim() || undefined,
        },
      },
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));
  }
  return [
    {
      price_data: {
        currency: "lkr",
        unit_amount: TOUR_PACKAGE_PRICE_LKR,
        product_data: {
          name: TOUR_PRODUCT_NAME,
          description: "Book your cycling tour package",
        },
      },
      quantity: 1,
    },
  ];
}

/**
 * Create Stripe Checkout Session. Returns session URL for redirect (Requirement ii).
 */
export async function createCheckoutSession(userId, lineItems) {
  ensureStripeConfigured();
  const items = buildLineItems(lineItems);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: items,
    mode: "payment",
    success_url: `${FRONTEND_ORIGIN}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_ORIGIN}/dashboard/payment/cancel`,
    metadata: {
      userId: String(userId),
      productName: items[0]?.price_data?.product_data?.name || TOUR_PRODUCT_NAME,
    },
  });
  return { url: session.url, sessionId: session.id };
}

/**
 * Retrieve Stripe session and create or update Payment record (confirm-session fallback).
 */
export async function retrieveSessionAndCreateOrUpdatePayment(sessionId, userId) {
  if (!stripe) {
    const err = new Error("Payment gateway is not configured");
    err.statusCode = 503;
    throw err;
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userId !== String(userId)) {
    const err = new Error("Session does not belong to this user");
    err.statusCode = 403;
    throw err;
  }
  const transactionId = session.id;
  const amount = session.amount_total != null ? session.amount_total : TOUR_PACKAGE_PRICE_LKR;
  const status = session.payment_status === "paid" ? "Success" : "Pending";
  const payload = {
    userId: session.metadata.userId,
    transactionId,
    amount,
    currency: session.currency || "lkr",
    status,
    productName: session.metadata?.productName || TOUR_PRODUCT_NAME,
  };
  const payment = await paymentRepository.upsertPayment(transactionId, payload);
  return { saved: true, payment };
}

/**
 * Verify webhook signature and return the event (Requirement iv).
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!stripe) {
    const err = new Error("Stripe not configured");
    err.statusCode = 503;
    throw err;
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    const err = new Error("STRIPE_WEBHOOK_SECRET required for webhook verification");
    err.statusCode = 503;
    throw err;
  }
  if (!signature) {
    const err = new Error("Missing stripe-signature header");
    err.statusCode = 400;
    throw err;
  }
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

/**
 * Handle Stripe webhook event (after signature verification).
 */
export async function handleWebhookEvent(event) {
  if (event.type !== "checkout.session.completed") return;
  const session = event.data.object;
  const transactionId = session.id;
  const amount = session.amount_total != null ? session.amount_total : TOUR_PACKAGE_PRICE_LKR;
  const status = session.payment_status === "paid" ? "Success" : "Pending";
  await paymentRepository.upsertPayment(transactionId, {
    userId: session.metadata?.userId,
    transactionId,
    amount,
    currency: session.currency || "lkr",
    status,
    productName: session.metadata?.productName || TOUR_PRODUCT_NAME,
  });
}
