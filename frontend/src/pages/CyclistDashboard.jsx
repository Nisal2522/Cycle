/**
 * pages/CyclistDashboard.jsx
 * --------------------------------------------------
 * Cyclist dashboard overview connected to the Node.js API.
 *
 * Responsive:
 *   Mobile  — 2-col stats, stacked quick-links, shorter map
 *   Tablet  — 3-col stats, 3-col quick-links
 *   Desktop — 5-col stats, full map
 *
 * Accessible at: /dashboard (index)
 * Protected: requires role "cyclist"
 * --------------------------------------------------
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bike,
  Leaf,
  Award,
  Route,
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Trophy,
  ArrowRight,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getCyclistStats } from "../services/cyclistService";
import LiveMap from "../components/LiveMap";
import WeatherWidget from "../components/WeatherWidget";

/* ── Animation ── */
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ── Stat card config ── */
const STAT_CONFIG = [
  { key: "totalRides",   label: "Total Rides",  icon: Bike,   color: "text-primary",    bgColor: "bg-primary/10",  format: (v) => v.toLocaleString() },
  { key: "co2Saved",     label: "CO₂ Saved",    icon: Leaf,   color: "text-emerald-500", bgColor: "bg-emerald-50",  format: (v) => `${v.toFixed(1)} kg` },
  { key: "tokens",       label: "Eco-Tokens",   icon: Award,  color: "text-amber-500",   bgColor: "bg-amber-50",    format: (v) => v.toLocaleString() },
  { key: "totalDistance", label: "Distance",     icon: Route,  color: "text-blue-500",    bgColor: "bg-blue-50",     format: (v) => `${v.toFixed(1)} km` },
  { key: "safetyScore",  label: "Safety Score",  icon: Shield, color: "text-violet-500",  bgColor: "bg-violet-50",   format: (v) => `${v}%` },
];

/* ── Quick action links ── */
const QUICK_LINKS = [
  {
    to: "/dashboard/map",
    label: "Open Live Map",
    desc: "Report hazards & plan routes",
    icon: MapPin,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    to: "/dashboard/rewards",
    label: "My Rewards",
    desc: "View your Eco-Token balance",
    icon: Award,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    to: "/dashboard/leaderboard",
    label: "Leaderboard",
    desc: "See the top 5 cyclists",
    icon: Trophy,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

export default function CyclistDashboard() {
  const { user, token } = useAuth();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    setStatsError("");
    try {
      const data = await getCyclistStats(token);
      setStats(data);
    } catch (err) {
      setStatsError(
        err.response?.data?.message || "Failed to load stats. Is the backend running?"
      );
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRideUpdate = (data) => {
    if (data?.totals) {
      setStats((prev) => (prev ? { ...prev, ...data.totals } : prev));
    }
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* ── Header + Weather ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Left: greeting */}
          <motion.div
            custom={0}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="shrink-0"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
              Welcome back,{" "}
              <span className="text-primary">{user?.name || "Cyclist"}</span>
            </h1>
            <p className="mt-0.5 sm:mt-1 text-slate-500 text-xs sm:text-sm lg:text-base">
              Your live cycling dashboard. Ride safe, earn green rewards!
            </p>
          </motion.div>

          {/* Right: weather widget */}
          <motion.div
            custom={1}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="w-full lg:w-auto lg:min-w-[340px] lg:max-w-[420px]"
          >
            <WeatherWidget />
          </motion.div>
        </div>

        {/* ── Error banner ── */}
        {statsError && (
          <motion.div
            custom={1}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-red-50 border border-red-100 text-xs sm:text-sm text-red-600 mb-3 sm:mb-4"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 line-clamp-2">{statsError}</span>
            <button
              onClick={fetchStats}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </motion.div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          {STAT_CONFIG.map((cfg, i) => {
            const Icon = cfg.icon;
            const value = stats ? cfg.format(stats[cfg.key] || 0) : "—";

            return (
              <motion.div
                key={cfg.key}
                custom={i + 1}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 sm:p-4 lg:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.22)] border border-slate-100/80 hover:shadow-[0_22px_60px_rgba(15,23,42,0.32)] transition-shadow"
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl ${cfg.bgColor} flex items-center justify-center mb-2 sm:mb-3`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${cfg.color}`} />
                </div>
                {statsLoading ? (
                  <div className="flex items-center gap-2 h-7 sm:h-8">
                    <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                  </div>
                ) : (
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    {value}
                  </p>
                )}
                <p className="text-[11px] sm:text-xs lg:text-sm text-slate-500 mt-0.5">
                  {cfg.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          {QUICK_LINKS.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.to}
                custom={i + 6}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <Link
                  to={link.to}
                  className="flex items-center gap-3 sm:gap-4 bg-white/95 backdrop-blur-xl rounded-2xl p-3 sm:p-4 lg:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.22)] border border-slate-100/80 hover:shadow-[0_22px_60px_rgba(15,23,42,0.32)] hover:border-primary/20 transition-all group"
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${link.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                      {link.label}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── Compact Live Map ── */}
        <motion.div
          custom={9}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(15,23,42,0.32)] border border-slate-100/80 overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Live Map</h2>
              <Link
                to="/dashboard/map"
                className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Full Screen
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Link>
            </div>
            <div className="h-[260px] sm:h-[350px] lg:h-[400px] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100/80">
              <LiveMap token={token} userId={user?._id} onRideUpdate={handleRideUpdate} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
