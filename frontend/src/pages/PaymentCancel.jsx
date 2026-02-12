/**
 * pages/PaymentCancel.jsx
 * --------------------------------------------------
 * Shown when user cancels Stripe checkout (cancel_url redirect).
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";

const MAROON = "#80134D";

export default function PaymentCancel() {
  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
          <XCircle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Payment canceled</h1>
        <p className="text-slate-600 mb-6">
          You canceled the checkout. No charge was made. You can try again whenever you’re ready.
        </p>
        <Link
          to="/dashboard/payment"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white"
          style={{ backgroundColor: MAROON }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payment
        </Link>
      </motion.div>
    </div>
  );
}
