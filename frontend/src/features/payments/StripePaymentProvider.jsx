/**
 * features/payments/StripePaymentProvider.jsx
 * --------------------------------------------------
 * Integrates @stripe/stripe-js and @stripe/react-stripe-js.
 * Loads Stripe publishable key; wraps children with Elements for future Card/Element use.
 * Redirect checkout does not require Elements; this enables in-page Stripe Elements later.
 */

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function StripePaymentProvider({ children }) {
  if (!stripePromise) return <>{children}</>;
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
