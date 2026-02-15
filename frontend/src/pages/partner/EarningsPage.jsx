/**
 * pages/partner/EarningsPage.jsx
 * --------------------------------------------------
 * Partner Earnings: Payment History table (monthly income & status).
 * Accessible at: /partner-dashboard/earnings
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, CheckCircle, Clock, Loader2, Receipt, Wallet } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { getPartnerEarnings, createPayoutRequest } from "../../services/partnerService";

const MAROON = "#80134D";

export default function EarningsPage() {
  const { token } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestAmount, setRequestAmount] = useState("");

  useEffect(() => {
    if (!token) return;
    getPartnerEarnings(token)
      .then((data) => {
        setAvailableBalance(data?.availableBalance || 0);
        setPayouts(Array.isArray(data?.payouts) ? data.payouts : []);
      })
      .catch(() => {
        setAvailableBalance(0);
        setPayouts([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const formatMonth = (m) => {
    if (!m || m.length < 7) return m;
    const [y, mo] = m.split("-");
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${names[parseInt(mo, 10) - 1]} ${y}`;
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-6 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6 sm:mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Payment History</h1>
            <p className="text-sm text-slate-500">
              Monthly income from token redemptions (10 LKR per token).
            </p>
          </div>
        </motion.div>

        {/* Available balance + Request payout — 3D card, increased back shadow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.08),0_10px_25px_rgba(0,0,0,0.05)] border-t border-white/30 px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Available Balance</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {availableBalance.toLocaleString()} LKR
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1 sm:flex-initial sm:max-w-xs">
          <form
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!token || requesting) return;
              setRequestError("");
              const amt = Number(requestAmount);
              if (!amt || amt <= 0) {
                setRequestError("Enter a positive amount.");
                return;
              }
              if (amt > availableBalance) {
                setRequestError("Amount exceeds available balance.");
                return;
              }
              setRequesting(true);
              try {
                const created = await createPayoutRequest(token, amt);
                setAvailableBalance((prev) => prev); // balance is deducted after admin approval
                setRequestAmount("");
                // Optional: show inline success text
              } catch (err) {
                setRequestError(
                  err.response?.data?.message || "Failed to create payout request."
                );
              } finally {
                setRequesting(false);
              }
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 flex-1 sm:flex-initial">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Amount (LKR)</label>
                <input
                  type="number"
                  min="1"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={requesting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold px-5 py-2.5 shadow-sm hover:bg-primary/90 disabled:opacity-60"
                >
              {requesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              Request Payout
                </button>
              </div>
            </div>
          </form>
            {requestError && (
              <p className="text-sm text-red-600">{requestError}</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.08),0_10px_25px_rgba(0,0,0,0.05)] border-t border-white/30 overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-3">
            <Receipt className="w-5 h-5" style={{ color: MAROON }} />
            <h2 className="text-lg font-semibold text-slate-800">Payment History</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[280px] py-20">
              <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: MAROON }} />
              <p className="text-sm text-slate-500">Loading payments...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[280px] py-20 text-center px-6 w-full">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700">No payments yet</p>
              <p className="text-sm text-slate-500 mt-3 max-w-sm">
                Your monthly payouts will appear here once processed by the admin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[480px]">
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
