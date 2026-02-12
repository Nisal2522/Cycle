/**
 * pages/PartnerDashboard.jsx
 * --------------------------------------------------
 * Dashboard for the "partner" role (business owners).
 *
 * Responsive:
 *   Mobile  — 2-col stats, stacked QR + redemptions
 *   Desktop — 4-col stats, side-by-side sections
 *
 * Accessible at: /partner-dashboard
 * Protected: requires role "partner"
 * --------------------------------------------------
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  BarChart3,
  Store,
  Users,
  Coins,
  Clock,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Gift,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import {
  getPartnerRewards,
  createReward,
  updateReward,
  deleteReward,
  redeemTokens,
} from "../services/partnerService";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const dummyRedemptions = [
  { customer: "Alex M.", tokens: 50, time: "2 min ago" },
  { customer: "Sara K.", tokens: 120, time: "15 min ago" },
  { customer: "Raj P.", tokens: 30, time: "1 hour ago" },
  { customer: "Emma L.", tokens: 80, time: "3 hours ago" },
];

export default function PartnerDashboard() {
  const { user, token } = useAuth();

  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [savingReward, setSavingReward] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    tokenCost: "",
    expiryDate: "",
  });
  const [formError, setFormError] = useState("");

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemTokensAmount, setRedeemTokensAmount] = useState("50");
  const [redeemResult, setRedeemResult] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // For greeting, show the partner's account name from signup
  const partnerDisplayName = useMemo(
    () => user?.name || "Partner",
    [user?.name]
  );

  const totalRedemptions = user?.partnerTotalRedemptions || 0;
  const activeRewards = rewards.filter((r) => r.active).length;

  const STATS = useMemo(
    () => [
      {
        icon: Coins,
        label: "Total Redemptions",
        value: totalRedemptions.toLocaleString(),
        barColor: "#f59e0b",
      },
      {
        icon: Store,
        label: "Active Rewards",
        value: activeRewards.toString(),
        barColor: "#871053",
      },
      {
        icon: Users,
        label: "Recent Cyclists",
        value: "Live",
        barColor: "#0ea5e9",
      },
      {
        icon: Clock,
        label: "Last Updated",
        value: "Just now",
        barColor: "#8b5cf6",
      },
    ],
    [activeRewards, totalRedemptions]
  );

  // Fetch rewards for this partner
  useEffect(() => {
    if (!token || !user?._id) return;
    let cancelled = false;
    setLoadingRewards(true);
    getPartnerRewards(token, user._id)
      .then((data) => {
        if (!cancelled) setRewards(data || []);
      })
      .catch(() => {
        if (!cancelled) setRewards([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRewards(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, user?._id]);

  const resetForm = () => {
    setEditingReward(null);
    setFormValues({
      title: "",
      description: "",
      tokenCost: "",
      expiryDate: "",
    });
    setFormError("");
  };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setFormValues({
      title: reward.title,
      description: reward.description || "",
      tokenCost: reward.tokenCost.toString(),
      expiryDate: reward.expiryDate
        ? reward.expiryDate.substring(0, 10)
        : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitReward = async (e) => {
    e.preventDefault();
    if (!token) return;

    const tokenCostNum = Number(formValues.tokenCost);
    if (!formValues.title.trim() || !tokenCostNum || tokenCostNum <= 0) {
      setFormError("Title and a positive token cost are required.");
      return;
    }

    setSavingReward(true);
    setFormError("");
    try {
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim() || undefined,
        tokenCost: tokenCostNum,
        expiryDate: formValues.expiryDate || undefined,
      };

      if (editingReward) {
        const updated = await updateReward(token, editingReward._id, payload);
        setRewards((prev) =>
          prev.map((r) => (r._id === updated._id ? updated : r))
        );
      } else {
        const created = await createReward(token, payload);
        setRewards((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save reward.");
    } finally {
      setSavingReward(false);
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (!token) return;
    try {
      await deleteReward(token, rewardId);
      setRewards((prev) => prev.filter((r) => r._id !== rewardId));
    } catch {
      // ignore for now; you could surface a toast here
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setRedeemResult("");
    setRedeemError("");
    if (!token) return;
    if (!redeemCode.trim()) {
      setRedeemError("Please enter a cyclist ID.");
      return;
    }
    const tokensNum = Number(redeemTokensAmount);
    if (!tokensNum || tokensNum <= 0) {
      setRedeemError("Please enter a valid token amount.");
      return;
    }

    setRedeeming(true);
    try {
      const data = await redeemTokens(token, {
        cyclistId: redeemCode.trim(),
        tokens: tokensNum,
      });
      setRedeemResult(
        `Redeemed ${data.redeemedTokens} tokens from ${data.cyclist.name}. Remaining balance: ${data.cyclist.tokens}.`
      );
      // Note: partnerTotalRedemptions is updated on backend; would normally refresh profile here.
    } catch (err) {
      setRedeemError(
        err.response?.data?.message || "Failed to redeem tokens. Please try again."
      );
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-6 sm:pb-8">
        {/* Header — aligned to left, matching main dashboard greeting style */}
        <motion.div
          custom={0}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
            Welcome back,{" "}
            <span className="text-primary">{partnerDisplayName}</span>
          </h1>
          <p className="mt-0.5 sm:mt-1 text-slate-500 text-xs sm:text-sm lg:text-base">
            Your shop dashboard. Manage redemptions, earn green rewards!
          </p>
        </motion.div>

        {/* Stats Grid — same style as admin overview (attachment 1): top bar, white icon circle, value, label */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                custom={i + 1}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.12)] border border-slate-100/80 hover:shadow-[0_26px_70px_rgba(15,23,42,0.18)] hover:border-slate-200 transition-all duration-300 min-w-0"
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: stat.barColor }} />
                <div className="p-4 sm:p-5">
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: "#ffffff",
                      color: stat.barColor,
                      boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
                    }}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p
                    className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 tracking-tight truncate"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                    title={stat.value}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 truncate" title={stat.label}>
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Layout: stacked on mobile, 2 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Reward Manager + Redemption Tool — redesigned */}
          <motion.div
            custom={5}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.32)] border border-slate-100/80 overflow-hidden flex flex-col gap-0 min-w-0"
          >
            {/* ── Reward Manager: header with accent ── */}
            <div className="bg-gradient-to-br from-primary/8 via-white to-amber-50/50 border-b border-slate-100 px-5 sm:px-6 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/10">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                      Reward Manager
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Create and manage token-based discounts for cyclists
                    </p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  {activeRewards} active
                </span>
              </div>
            </div>

            {/* ── Create reward form ── */}
            <form
              onSubmit={handleSubmitReward}
              className="px-5 sm:px-6 py-4 sm:py-5 bg-slate-50/70 border-b border-slate-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reward title</label>
                  <input
                    type="text"
                    value={formValues.title}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, title: e.target.value }))
                    }
                    placeholder="e.g. 10% Off Coffee"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tokens</label>
                  <input
                    type="number"
                    min="1"
                    value={formValues.tokenCost}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, tokenCost: e.target.value }))
                    }
                    placeholder="Cost"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Short description (optional)</label>
                <textarea
                  rows={2}
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, description: e.target.value }))
                  }
                  placeholder="Brief offer description"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none shadow-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Optional expiry</label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={formValues.expiryDate}
                      onChange={(e) =>
                        setFormValues((v) => ({
                          ...v,
                          expiryDate: e.target.value,
                        }))
                      }
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-h-[44px] sm:min-h-[42px]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingReward}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/30 hover:bg-primary/95 active:scale-[0.98] disabled:opacity-60 min-h-[44px] touch-manipulation transition-all"
                >
                  {savingReward ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingReward ? (
                    <Pencil className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingReward ? "Update Reward" : "Add Reward"}
                </button>
              </div>
              {formError && (
                <p className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {formError}
                </p>
              )}
            </form>

            {/* ── Active Rewards table ── */}
            <div className="px-5 sm:px-6 py-4 flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Active Rewards
                </h3>
                {!loadingRewards && rewards.length > 0 && (
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {rewards.length} {rewards.length === 1 ? "reward" : "rewards"}
                  </span>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm min-w-0">
                <div className="hidden sm:grid grid-cols-[minmax(0,2fr),90px,100px,80px] gap-4 px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                  <span>Reward</span>
                  <span>Cost</span>
                  <span>Expiry</span>
                  <span className="text-right">Actions</span>
                </div>
                {loadingRewards ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading rewards…</p>
                  </div>
                ) : rewards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-amber-100 flex items-center justify-center mb-4">
                      <Coins className="w-7 h-7 text-primary/70" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No rewards yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                      Create your first offer above to start accepting token redemptions from cyclists.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {rewards.map((r) => (
                      <li key={r._id} className="group hover:bg-slate-50/80 transition-colors">
                        <div className="sm:hidden px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-sm" title={r.title}>
                                {r.title}
                              </p>
                              {r.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {r.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60">
                                  {r.tokenCost} tokens
                                </span>
                                <span className="text-xs text-slate-400">
                                  {r.expiryDate
                                    ? new Date(r.expiryDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "No expiry"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditReward(r)}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 bg-slate-100 hover:bg-primary/10 hover:text-primary transition-all touch-manipulation"
                                aria-label="Edit reward"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReward(r._id)}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 bg-slate-100 hover:bg-red-50 hover:text-red-500 transition-all touch-manipulation"
                                aria-label="Delete reward"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:grid grid-cols-[minmax(0,2fr),90px,100px,80px] gap-4 px-4 py-3.5 items-center text-sm">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate" title={r.title}>
                              {r.title}
                            </p>
                            {r.description && (
                              <p className="text-xs text-slate-500 truncate mt-0.5" title={r.description}>
                                {r.description}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200/60 w-fit">
                            {r.tokenCost}
                          </span>
                          <span className="text-slate-500 text-xs font-medium">
                            {r.expiryDate
                              ? new Date(r.expiryDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditReward(r)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                              aria-label="Edit reward"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReward(r._id)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                              aria-label="Delete reward"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* ── Redemption Tool ── */}
            <div className="mx-5 sm:mx-6 mb-5 sm:mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-primary/5 border border-slate-200/80 shadow-inner">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Redemption Tool
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cyclist ID or QR value + token amount
                  </p>
                </div>
              </div>
              <form
                onSubmit={handleRedeem}
                className="flex flex-col sm:flex-row gap-3 sm:items-end"
              >
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cyclist ID</label>
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="Enter ID or scan QR"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                  />
                </div>
                <div className="sm:w-24">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tokens</label>
                  <input
                    type="number"
                    min="1"
                    value={redeemTokensAmount}
                    onChange={(e) => setRedeemTokensAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/30 hover:bg-primary/95 active:scale-[0.98] disabled:opacity-60 min-h-[44px] touch-manipulation transition-all"
                >
                  {redeeming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Redeem
                </button>
              </form>
              {redeemError && (
                <p className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{redeemError}</span>
                </p>
              )}
              {redeemResult && (
                <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2.5 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{redeemResult}</span>
                </p>
              )}
            </div>
          </motion.div>

          {/* Recent Redemptions — professional card */}
          <motion.div
            custom={6}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.32)] border border-slate-100 overflow-hidden min-w-0"
          >
            <div className="bg-gradient-to-br from-amber-50/80 via-white to-primary/5 border-b border-slate-100 px-4 sm:px-6 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200/60 shadow-sm">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent Redemptions</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Latest token redemptions at your shop</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {dummyRedemptions.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-slate-50/80 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 ring-2 ring-white shadow-sm">
                      {item.customer.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.customer}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60">
                    −{item.tokens}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
