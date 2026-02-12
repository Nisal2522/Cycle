/**
 * pages/PaymentPage.jsx
 * --------------------------------------------------
 * Cycling Tour Package checkout via Stripe.
 * "Pay Now" calls backend for session URL and redirects with window.location.href.
 * Success/cancel feedback is on separate Success.jsx and Cancel.jsx pages.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2, Bike } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { createCheckoutSession } from "../services/paymentService";
import toast from "react-hot-toast";

const MAROON = "#80134D";

export default function PaymentPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayNow = async () => {
    if (!token) {
      toast.error("Please sign in to continue");
      return;
    }
    setLoading(true);
    try {
      const { url } = await createCheckoutSession(token);
      if (url) window.location.href = url;
      else toast.error("Could not start checkout");
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${MAROON}20` }}>
              <Bike className="w-6 h-6" style={{ color: MAROON }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Cycling Tour Package</h1>
              <p className="text-slate-500 text-sm">Book your tour — secure payment via Stripe</p>
            </div>
          </div>

          <p className="text-slate-600 mb-6">
            Get the full cycling tour experience for{" "}
            <strong className="text-slate-800">Rs. 1,500</strong>. You will be redirected to Stripe Checkout to complete payment.
          </p>

          <button
            type="button"
            onClick={handlePayNow}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: MAROON }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay Now
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
