/**
 * features/payments/PaymentButton.jsx
 * --------------------------------------------------
 * "Pay Now" button: calls backend via axiosClient (paymentService), then
 * redirects with window.location.assign(response.data.url) to Stripe Checkout.
 */

import { useState } from "react";
import useAuth from "../../hooks/useAuth";
import { createCheckoutSession } from "../../services/paymentService";
import toast from "react-hot-toast";

export default function PaymentButton({ lineItems, children, className, ...props }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayNow = async () => {
    if (!token) {
      toast.error("Please sign in to continue");
      return;
    }
    setLoading(true);
    try {
      const body = lineItems && lineItems.length > 0 ? { lineItems } : {};
      const response = await createCheckoutSession(token, body);
      const url = response?.url;
      if (url) {
        window.location.assign(url);
      } else {
        toast.error("Could not start checkout");
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayNow}
      disabled={loading}
      className={className}
      {...props}
    >
      {children ?? (loading ? "Redirecting…" : "Pay Now")}
    </button>
  );
}
