/**
 * pages/partner/EarningsPage.jsx
 * --------------------------------------------------
 * Partner Earnings: Payment History table (monthly income & status).
 * Accessible at: /partner-dashboard/earnings
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, CheckCircle, Clock, Loader2, Receipt } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { getMyPayouts } from "../../services/partnerService";

const MAROON = "#80134D";

export default function EarningsPage() {
  const { token } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getMyPayouts(token)
      .then(setPayouts)
      .catch(() => setPayouts([]))
      .finally(() => setLoading(false));
  }, [token]);

  const formatMonth = (m) => {
    if (!m || m.length < 7) return m;
    const [y, mo] = m.split("-");
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${names[parseInt(mo, 10) - 1]} ${y}`;
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: MAROON }}>
            <DollarSign className="w-4 h-4" />
            Earnings
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">Payment History</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monthly income from token redemptions (10 LKR per token).
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: MAROON }} />
            <h2 className="text-lg font-semibold text-slate-800">Payment History</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: MAROON }} />
              <p className="text-sm text-slate-500">Loading payments...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Calendar className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No payments yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Your monthly payouts will appear here once processed by the admin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Tokens Redeemed</th>
                    <th className="px-4 py-3">Amount (LKR)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{formatMonth(p.month)}</td>
                      <td className="px-4 py-3 text-slate-600">{p.totalTokens}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: MAROON }}>
                        {p.totalAmount?.toLocaleString()} LKR
                      </td>
                      <td className="px-4 py-3">
                        {p.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono truncate max-w-[140px]" title={p.transactionId}>
                        {p.status === "Paid" && p.transactionId ? p.transactionId : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
