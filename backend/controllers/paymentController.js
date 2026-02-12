/**
 * controllers/paymentController.js
 * --------------------------------------------------
 * Stripe Checkout: create session, webhook to save/update payment.
 * - POST /api/payments/create-checkout-session (protected)
 * - POST /api/payments/webhook (raw body, no auth)
 */

import Stripe from "stripe";
import Payment from "../models/Payment.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" })
  : null;

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const TOUR_PACKAGE_PRICE_LKR = 1500;
const TOUR_PRODUCT_NAME = "Cycling Tour Package";

/**
 * @desc    Create Stripe Checkout Session for Cycling Tour Package (Rs. 1500)
 * @route   POST /api/payments/create-checkout-session
 * @access  Protected
 */
export async function createCheckoutSession(req, res) {
  if (!stripe) {
    res.status(503);
    throw new Error("Payment gateway is not configured. Set STRIPE_SECRET_KEY in .env");
  }
  const userId = req.user?._id;
  if (!userId) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "lkr",
          unit_amount: TOUR_PACKAGE_PRICE_LKR, // LKR zero-decimal
          product_data: {
            name: TOUR_PRODUCT_NAME,
            description: "Book your cycling tour package",
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${FRONTEND_ORIGIN}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_ORIGIN}/dashboard/payment/cancel`,
    metadata: {
      userId: String(userId),
      productName: TOUR_PRODUCT_NAME,
    },
  });

  res.json({ url: session.url, sessionId: session.id });
}

/**
 * @desc    On success return: retrieve session from Stripe and save/update payment (fallback when webhook not used)
 * @route   POST /api/payments/confirm-session
 * @body    { sessionId: string }
 * @access  Protected
 */
export async function confirmSession(req, res) {
  if (!stripe) {
    res.status(503);
    throw new Error("Payment gateway is not configured");
  }
  const userId = req.user?._id;
  const { sessionId } = req.body || {};
  if (!userId || !sessionId) {
    res.status(400);
    throw new Error("sessionId is required");
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userId !== String(userId)) {
    res.status(403);
    throw new Error("Session does not belong to this user");
  }
  const transactionId = session.payment_intent || session.id;
  const amount = session.amount_total != null ? session.amount_total : TOUR_PACKAGE_PRICE_LKR;
  const status = session.payment_status === "paid" ? "Success" : "Pending";
  let payment = await Payment.findOne({ transactionId: session.id });
  if (payment) {
    payment.status = status;
    await payment.save();
    return res.json({ saved: true, payment });
  }
  payment = await Payment.create({
    userId: session.metadata.userId,
    transactionId,
    amount,
    currency: session.currency || "lkr",
    status,
    productName: session.metadata?.productName || TOUR_PRODUCT_NAME,
  });
  res.json({ saved: true, payment });
}

/**
 * @desc    Stripe webhook: on checkout.session.completed, create or update Payment with status "Success"
 * @route   POST /api/payments/webhook
 * @access  Public (verified by Stripe signature)
 */
export function stripeWebhook(req, res) {
  if (!stripe) {
    res.status(503).send("Webhook skipped: Stripe not configured");
    return;
  }
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("STRIPE_WEBHOOK_SECRET not set; webhook not verifying signature");
    res.status(200).send("ok");
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const amount = session.amount_total != null ? session.amount_total : TOUR_PACKAGE_PRICE_LKR;
    const transactionId = session.payment_intent || session.id;
    const status = session.payment_status === "paid" ? "Success" : "Pending";

    Payment.findOneAndUpdate(
      { transactionId },
      {
        $set: {
          userId,
          transactionId,
          amount,
          currency: session.currency || "lkr",
          status,
          productName: session.metadata?.productName || TOUR_PRODUCT_NAME,
        },
      },
      { upsert: true, new: true }
    ).catch((err) => console.error("Payment save/update failed:", err));
  }

  res.status(200).send("ok");
}
