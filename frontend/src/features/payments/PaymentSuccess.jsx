/**
 * features/payments/PaymentSuccess.jsx
 * --------------------------------------------------
 * Shown after successful Stripe checkout (success_url redirect).
 * Confirms session with backend so payment is saved if webhook wasn't used.
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { confirmSession } from "../../services/paymentService";
import toast from "react-hot-toast";

const MAROON = "#80134D";

export default function PaymentSuccess() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!sessionId || !token || confirming) return;
    setConfirming(true);
    confirmSession(token, sessionId)
      .then(() => {
        toast.success("Payment recorded successfully.", { iconTheme: { primary: MAROON } });
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403 || status === 400) {
          toast.error("Could not record payment. Try refreshing the page.", { duration: 5000 });
        }
      })
      .finally(() => setConfirming(false));
  }, [sessionId, token, confirming]);

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Payment successful</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Thank you for purchasing the Cycling Tour Package. Your booking is confirmed.
        </p>
        {confirming && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Recording your payment…</p>
        )}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: MAROON }}
        >
          Back to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
