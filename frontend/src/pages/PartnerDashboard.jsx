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
  ArrowUpRight,
  Coins,
  Clock,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
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
        trend: totalRedemptions > 0 ? "+ Live" : "New",
        color: "text-amber-500",
      },
      {
        icon: Store,
        label: "Active Rewards",
        value: activeRewards.toString(),
        trend: activeRewards > 0 ? "Running" : "None",
        color: "text-primary",
      },
      {
        icon: Users,
        label: "Recent Cyclists",
        value: "Live",
        trend: "+engagement",
        color: "text-blue-500",
      },
      {
        icon: Clock,
        label: "Last Updated",
        value: "Just now",
        trend: "",
        color: "text-violet-500",
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
    <div className="min-h-[100dvh] md:min-h-screen overflow-x-hidden">
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

        {/* Stats Grid — 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i + 1}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-2.5 sm:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.22)] border border-slate-100/80 hover:shadow-[0_22px_60px_rgba(15,23,42,0.32)] transition-shadow min-w-0"
            >
              <div className="flex items-center justify-between mb-1 sm:mb-3 gap-1">
                <stat.icon className={`w-4 h-4 sm:w-6 sm:h-6 shrink-0 ${stat.color}`} />
                <span className="text-[9px] sm:text-xs font-medium text-emerald-600 bg-emerald-50 px-1 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 truncate max-w-[80%] sm:max-w-none">
                  <ArrowUpRight className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">{stat.trend}</span>
                </span>
              </div>
              <p className="text-base sm:text-2xl font-bold text-slate-900 truncate" title={stat.value}>{stat.value}</p>
              <p className="text-[10px] sm:text-sm text-slate-500 truncate" title={stat.label}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Layout: stacked on mobile, 2 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Reward Manager + Redemption Tool */}
          <motion.div
            custom={5}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-3 sm:p-6 lg:p-7 shadow-[0_20px_60px_rgba(15,23,42,0.35)] border border-slate-100/80 flex flex-col gap-3 sm:gap-5 min-w-0"
          >
            {/* Reward Manager Header */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                    Reward Manager
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {activeRewards} active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Create and manage token-based discounts for cyclists.
              </p>
            </div>

            {/* Reward form */}
            <form
              onSubmit={handleSubmitReward}
              className="space-y-2.5 sm:space-y-3 border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-slate-50/60"
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={formValues.title}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, title: e.target.value }))
                  }
                  placeholder="Reward title (e.g. 10% Off)"
                  className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-2.5 sm:py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/60"
                />
                <input
                  type="number"
                  min="1"
                  value={formValues.tokenCost}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, tokenCost: e.target.value }))
                  }
                  placeholder="Tokens"
                  className="sm:w-28 w-full border border-slate-200 rounded-lg px-3 py-2.5 sm:py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/60"
                />
              </div>
              <textarea
                rows={2}
                value={formValues.description}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, description: e.target.value }))
                }
                placeholder="Short description (optional)"
                className="w-full min-w-0 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/60 resize-none"
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Optional expiry</span>
                  <input
                    type="date"
                    value={formValues.expiryDate}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        expiryDate: e.target.value,
                      }))
                    }
                    className="border border-slate-200 rounded-lg px-2.5 py-2 sm:py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 min-h-[44px] sm:min-h-0"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingReward}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-1.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-60 min-h-[44px] touch-manipulation"
                >
                  {savingReward ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : editingReward ? (
                    <Pencil className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  {editingReward ? "Update Reward" : "Add Reward"}
                </button>
              </div>
              {formError && (
                <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {formError}
                </p>
              )}
            </form>

            {/* Active Rewards — professional table / cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                  Active Rewards
                </h3>
                {!loadingRewards && rewards.length > 0 && (
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {rewards.length} {rewards.length === 1 ? "reward" : "rewards"}
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden min-w-0">
                {/* Desktop: table header */}
                <div className="hidden sm:grid grid-cols-[minmax(0,2fr),100px,110px,88px] gap-3 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
                  <span>Reward</span>
                  <span>Cost</span>
                  <span>Expiry</span>
                  <span className="text-right">Actions</span>
                </div>
                {loadingRewards ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-sm text-slate-500">Loading rewards…</p>
                  </div>
                ) : rewards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Coins className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No rewards yet</p>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-[220px]">
                      Create your first offer above to start accepting token redemptions.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {rewards.map((r) => (
                      <li key={r._id} className="group">
                        {/* Mobile: card row */}
                        <div className="sm:hidden px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-sm" title={r.title}>
                                {r.title}
                              </p>
                              {r.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {r.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
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
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditReward(r)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 bg-slate-50 hover:bg-primary/10 hover:text-primary transition-colors touch-manipulation"
                                aria-label="Edit reward"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReward(r._id)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-500 transition-colors touch-manipulation"
                                aria-label="Delete reward"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Desktop: table row */}
                        <div className="hidden sm:grid grid-cols-[minmax(0,2fr),100px,110px,88px] gap-3 px-4 py-3 items-center text-sm">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate" title={r.title}>
                              {r.title}
                            </p>
                            {r.description && (
                              <p className="text-xs text-slate-500 truncate mt-0.5" title={r.description}>
                                {r.description}
                              </p>
                            )}
                          </div>
                          <span className="font-medium text-amber-700">
                            {r.tokenCost} <span className="text-slate-400 font-normal">tokens</span>
                          </span>
                          <span className="text-slate-500 text-xs">
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
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
                              aria-label="Edit reward"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReward(r._id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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

            {/* Redemption Tool */}
            <div className="border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-slate-50/60">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Redemption Tool
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Enter cyclist ID (or QR value) and token amount to redeem.
              </p>
              <form
                onSubmit={handleRedeem}
                className="flex flex-col sm:flex-row gap-2 sm:items-center"
              >
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="Cyclist ID"
                  className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-2.5 sm:py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/60"
                />
                <input
                  type="number"
                  min="1"
                  value={redeemTokensAmount}
                  onChange={(e) => setRedeemTokensAmount(e.target.value)}
                  className="w-full sm:w-24 border border-slate-200 rounded-lg px-3 py-2.5 sm:py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/60"
                />
                <button
                  type="submit"
                  disabled={redeeming}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-1.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-60 min-h-[44px] touch-manipulation"
                >
                  {redeeming ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  Redeem
                </button>
              </form>
              {redeemError && (
                <p className="mt-2 text-xs text-red-500 flex items-start gap-1.5 break-words">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{redeemError}</span>
                </p>
              )}
              {redeemResult && (
                <p className="mt-2 text-xs text-emerald-600 flex items-start gap-1.5 break-words">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{redeemResult}</span>
                </p>
              )}
            </div>
          </motion.div>

          {/* Recent Redemptions (still mocked for now) */}
          <motion.div
            custom={6}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-3 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.32)] border border-slate-100/80 min-w-0"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <h3 className="text-sm sm:text-lg font-semibold text-slate-700">Recent Redemptions</h3>
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            </div>
            <div className="space-y-0 sm:space-y-2">
              {dummyRedemptions.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-3 sm:py-3 border-b border-slate-100 last:border-0 min-w-0"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {item.customer.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.customer}</p>
                      <p className="text-xs text-slate-400">{item.time}</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-amber-600 shrink-0">
                    -{item.tokens}
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
