/**
 * pages/AdminDashboard.jsx
 * --------------------------------------------------
 * Super Admin Dashboard: stats, users, routes, payouts, chart.
 * Protected: user.role === "admin". JWT on all API calls.
 * Theme: Clean white with Maroon (#80134D) accents.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import toast from "react-hot-toast";
import {
  Users,
  Map,
  Route,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Store,
  Trash2,
  Ban,
  CheckCircle,
  Loader2,
  ChevronRight,
  DollarSign,
  Calendar,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import {
  getAdminStats,
  getAdminUserGrowthStats,
  getAdminUsers,
  verifyUser,
  blockUser,
  deleteUser,
  getAdminRoutes,
  deleteAdminRoute,
  getAdminPayouts,
  calculatePayouts,
  processPayout,
} from "../services/adminService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement
);

const MAROON = "#80134D";
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TABS = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "users", label: "Users & Partners", icon: Users },
  { id: "routes", label: "Route Moderation", icon: Route },
  { id: "payouts", label: "Payout Management", icon: DollarSign },
];

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  const [actioning, setActioning] = useState(null);
  const [payoutMonth, setPayoutMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [calculating, setCalculating] = useState(false);
  const [processingPayoutId, setProcessingPayoutId] = useState(null);
  const [adminApi404, setAdminApi404] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // "all" | "cyclist" | "partner" | "admin"
  const [growthPeriod, setGrowthPeriod] = useState("thisYear"); // "thisYear" | "thisMonth"
  const [growthData, setGrowthData] = useState(null);
  const [loadingGrowth, setLoadingGrowth] = useState(true);

  useEffect(() => {
    if (!token) return;
    setAdminApi404(false);
    getAdminStats(token)
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        if (err.response?.status === 404) setAdminApi404(true);
        toast.error(
          err.response?.status === 404
            ? "Admin API not found. Restart the backend (cd backend && npm run dev) then refresh."
            : err.response?.data?.message || "Failed to load stats",
          { id: "admin-stats", duration: 6000 }
        );
      })
      .finally(() => setLoadingStats(false));
  }, [token]);

  useEffect(() => {
    if (!token || activeTab !== "overview") return;
    setLoadingGrowth(true);
    getAdminUserGrowthStats(token, growthPeriod)
      .then(setGrowthData)
      .catch((err) => {
        if (err.response?.status === 404) setAdminApi404(true);
        toast.error(
          err.response?.data?.message || "Failed to load growth stats",
          { id: "admin-growth", duration: 4000 }
        );
      })
      .finally(() => setLoadingGrowth(false));
  }, [token, activeTab, growthPeriod]);

  useEffect(() => {
    if (activeTab === "users" && token) {
      setLoadingUsers(true);
      getAdminUsers(token)
        .then(setUsers)
        .catch(() => toast.error("Failed to load users"))
        .finally(() => setLoadingUsers(false));
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== "routes" || !token) return;
    setLoadingRoutes(true);
    getAdminRoutes(token)
      .then(setRoutes)
      .catch((err) => {
        const msg = err.response?.status === 401
          ? "Session expired or not authorized. Please sign in again."
          : err.response?.data?.message || "Failed to load routes";
        toast.error(msg);
      })
      .finally(() => setLoadingRoutes(false));
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab === "payouts" && token) {
      setLoadingPayouts(true);
      getAdminPayouts(token)
        .then(setPayouts)
        .catch(() => toast.error("Failed to load payouts"))
        .finally(() => setLoadingPayouts(false));
    }
  }, [activeTab, token]);

  const handleVerify = async (u) => {
    setActioning(u._id);
    try {
      await verifyUser(token, u._id);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isVerified: true, status: "Active" } : x)));
      toast.success("User verified", { iconTheme: { primary: MAROON } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to verify");
    } finally {
      setActioning(null);
    }
  };

  const handleBlock = async (u, block) => {
    setActioning(u._id);
    try {
      await blockUser(token, u._id, block);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isBlocked: block, status: block ? "Blocked" : (x.role === "partner" && !x.isVerified ? "Pending" : "Active") } : x)));
      toast.success(block ? "User blocked" : "User unblocked", { iconTheme: { primary: MAROON } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setActioning(null);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setActioning(u._id);
    try {
      await deleteUser(token, u._id);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
      toast.success("User deleted", { iconTheme: { primary: MAROON } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete");
    } finally {
      setActioning(null);
    }
  };

  const handleDeleteRoute = async (r) => {
    if (!window.confirm("Delete this route? This cannot be undone.")) return;
    setActioning(r._id);
    try {
      await deleteAdminRoute(token, r._id);
      setRoutes((prev) => prev.filter((x) => x._id !== r._id));
      toast.success("Route deleted", { iconTheme: { primary: MAROON } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete");
    } finally {
      setActioning(null);
    }
  };

  const handleCalculatePayouts = async () => {
    setCalculating(true);
    try {
      const res = await calculatePayouts(token, payoutMonth);
      toast.success(res.message || "Payouts calculated", { iconTheme: { primary: MAROON } });
      const list = await getAdminPayouts(token);
      setPayouts(list);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to calculate");
    } finally {
      setCalculating(false);
    }
  };

  const handleProcessPayout = async (p) => {
    setProcessingPayoutId(p._id);
    try {
      await processPayout(token, p._id);
      setPayouts((prev) => prev.map((x) => (x._id === p._id ? { ...x, status: "Paid" } : x)));
      toast.success("Payout processed", { iconTheme: { primary: MAROON } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const PINK = "#C73E84";
  const growthChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.2,
    layout: { padding: { top: 12, right: 16, bottom: 8, left: 8 } },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { family: "Inter", size: 12, weight: "600" },
          color: "#475569",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        titleFont: { size: 12, weight: "600" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items) => items[0]?.label || "",
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: growthData?.labels?.length > 14,
          maxRotation: 45,
          minRotation: 0,
          font: { size: 11, weight: "500" },
          color: "#64748b",
          maxTicksLimit: 12,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11, weight: "500" },
          color: "#64748b",
        },
        grid: { color: "rgba(148,163,184,0.2)" },
      },
    },
  };

  const growthChartDataConfig = growthData
    ? {
        labels: growthData.labels,
        datasets: [
          {
            label: "Cyclists",
            data: growthData.userData ?? [],
            borderColor: MAROON,
            backgroundColor: "rgba(128,19,77,0.1)",
            borderWidth: 2,
            tension: 0.3,
            pointBackgroundColor: MAROON,
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
            pointRadius: 3,
          },
          {
            label: "Partners",
            data: growthData.partnerData ?? [],
            borderColor: PINK,
            backgroundColor: "rgba(199,62,132,0.1)",
            borderWidth: 2,
            tension: 0.3,
            pointBackgroundColor: PINK,
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
            pointRadius: 3,
          },
        ],
      }
    : null;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: MAROON }}>
            <ShieldCheck className="w-4 h-4" />
            Super Admin
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage users, routes, and partner payouts — <span className="font-medium text-slate-700">{user?.name}</span>
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200 pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                style={activeTab === tab.id ? { backgroundColor: MAROON } : {}}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <>
            {adminApi404 && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <strong>Why you see this:</strong> The server returned 404 for the Admin API. The backend that is running is either an old instance (started before Admin was added) or not running. <strong>Fix:</strong> Stop the process on port 5000, then run <code className="bg-amber-100 px-1 rounded">cd backend && npm run dev</code>. After you see &quot;Admin API: GET /api/admin/stats...&quot;, refresh this page.
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {loadingStats ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-28" />
                ))
              ) : (
                [
                  { icon: Users, label: "Total Users", value: stats?.totalUsers ?? 0, color: MAROON },
                  { icon: Store, label: "Partners", value: stats?.totalPartners ?? 0, color: "#0ea5e9" },
                  { icon: Route, label: "Saved Routes", value: stats?.totalRoutes ?? 0, color: "#22c55e" },
                  { icon: AlertTriangle, label: "Reported Hazards", value: stats?.totalHazards ?? 0, color: "#f59e0b" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    custom={i + 1}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                  >
                    <s.icon className="w-6 h-6 mb-2" style={{ color: s.color }} />
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-sm text-slate-500">{s.label}</p>
                  </motion.div>
                ))
              )}
            </div>
            {/* User & Partner Growth Over Time — Line chart */}
            <motion.div
              custom={5}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="mt-6 bg-white rounded-3xl border border-slate-200/60 overflow-hidden"
              style={{
                boxShadow: "0 0 0 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 12px 24px rgba(15,23,42,0.08)",
              }}
            >
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${MAROON} 0%, ${PINK} 100%)` }} />
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-slate-800">User & Partner Growth Over Time</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGrowthPeriod("thisMonth")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        growthPeriod === "thisMonth" ? "text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                      }`}
                      style={growthPeriod === "thisMonth" ? { backgroundColor: MAROON } : {}}
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrowthPeriod("thisYear")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        growthPeriod === "thisYear" ? "text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                      }`}
                      style={growthPeriod === "thisYear" ? { backgroundColor: MAROON } : {}}
                    >
                      This Year
                    </button>
                  </div>
                </div>
                <div className="relative" style={{ minHeight: 280 }}>
                  {loadingGrowth ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
                    </div>
                  ) : growthChartDataConfig ? (
                    <Line data={growthChartDataConfig} options={growthChartOptions} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-slate-500 font-medium">No growth data</p>
                      <p className="text-xs text-slate-400 mt-1">Data will appear once users and partners exist</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Users & Partners — professional premium UI */}
        {activeTab === "users" && (
          <motion.div
            custom={0}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl overflow-hidden border border-slate-200/60"
            style={{
              boxShadow: "0 0 0 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 12px 24px rgba(15,23,42,0.08)",
            }}
          >
            {/* Top accent */}
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${MAROON} 0%, #b81b5e 50%, #d94680 100%)` }}
            />
            {/* Header with subtle gradient */}
            <div
              className="px-6 sm:px-8 py-6 border-b border-slate-100"
              style={{ background: "linear-gradient(180deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,1) 100%)" }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${MAROON} 0%, #a0155e 100%)`,
                      boxShadow: `0 4px 14px ${MAROON}40`,
                    }}
                  >
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Users & Partners</h2>
                      <span
                        className="min-w-[1.5rem] h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: MAROON }}
                      >
                        {users.filter((u) => userRoleFilter === "all" || u.role === userRoleFilter).length}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Manage accounts and roles</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { value: "all", label: "All", icon: Users },
                    { value: "cyclist", label: "Cyclists", icon: UserCheck },
                    { value: "partner", label: "Partners", icon: Store },
                    { value: "admin", label: "Admins", icon: ShieldCheck },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = userRoleFilter === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        onClick={() => setUserRoleFilter(opt.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "text-white shadow-lg ring-2 ring-offset-2 ring-white/50"
                            : "text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                        style={
                          active
                            ? { backgroundColor: MAROON, boxShadow: `0 4px 12px ${MAROON}50` }
                            : {}
                        }
                      >
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </motion.button>
                    );
                  })}
                  {loadingUsers && <Loader2 className="w-5 h-5 animate-spin ml-1" style={{ color: MAROON }} />}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-200/80">
                    <th className="px-6 py-4 pl-8">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Shop / Status</th>
                    <th className="px-6 py-4 pr-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => userRoleFilter === "all" || u.role === userRoleFilter)
                    .map((u, idx) => (
                      <motion.tr
                        key={u._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`group border-b border-slate-100 transition-all duration-200 ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                        } hover:bg-[#80134D]/[0.06] hover:border-l-4 hover:border-l-[#80134D]`}
                        style={{ borderLeftColor: "transparent" }}
                      >
                        <td className="px-6 py-4 pl-8">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold text-white shrink-0 ring-2 ring-white shadow-md"
                              style={{
                                background:
                                  u.role === "admin"
                                    ? "linear-gradient(135deg, #475569 0%, #64748b 100%)"
                                    : u.role === "partner"
                                      ? "linear-gradient(135deg, #b45309 0%, #d97706 100%)"
                                      : "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
                                boxShadow:
                                  u.role === "admin"
                                    ? "0 4px 12px rgba(71,85,105,0.35)"
                                    : u.role === "partner"
                                      ? "0 4px 12px rgba(217,119,6,0.35)"
                                      : "0 4px 12px rgba(14,165,233,0.35)",
                              }}
                            >
                              {(u.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 tracking-tight">{u.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5 font-medium">{u.email}</p>
                              <span className="inline-flex items-center mt-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono truncate max-w-[200px] border shadow-sm" style={{ backgroundColor: `${MAROON}12`, borderColor: `${MAROON}40`, color: MAROON }} title={u._id}>
                                ID: {u._id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border ${
                              u.role === "admin"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : u.role === "partner"
                                  ? "bg-amber-50 text-amber-600 border-amber-200/80"
                                  : "bg-sky-50 text-sky-600 border-sky-200/80"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.role === "partner" ? (
                            <div className="inline-flex items-center gap-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 px-3.5 py-2 shadow-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide shrink-0 ${
                                  u.status === "Blocked"
                                    ? "bg-red-100 text-red-600 border border-red-200/80"
                                    : u.status === "Pending"
                                      ? "bg-amber-100 text-amber-600 border border-amber-200/80"
                                      : "bg-emerald-100 text-emerald-600 border border-emerald-200/80"
                                }`}
                              >
                                {u.status}
                              </span>
                              <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]" title={u.shopName || "—"}>
                                {u.shopName || "—"}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${
                                u.status === "Blocked"
                                  ? "bg-red-50 text-red-600 border-red-200/80"
                                  : u.status === "Pending"
                                    ? "bg-amber-50 text-amber-600 border-amber-200/80"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-200/80"
                              }`}
                            >
                              {u.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 pr-8 text-right">
                          {u.role !== "admin" && (
                            <div className="flex items-center justify-end gap-1">
                              {!u.isVerified && u.role !== "cyclist" && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(u)}
                                  disabled={actioning === u._id}
                                  className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                                  title="Verify"
                                >
                                  {actioning === u._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleBlock(u, !u.isBlocked)}
                                disabled={actioning === u._id}
                                className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                                title={u.isBlocked ? "Unblock" : "Block"}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                disabled={actioning === u._id}
                                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
            {users.filter((u) => userRoleFilter === "all" || u.role === userRoleFilter).length === 0 && !loadingUsers && (
              <div className="py-20 px-8 text-center">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 opacity-90"
                  style={{ background: `linear-gradient(135deg, ${MAROON}18 0%, ${MAROON}08 100%)` }}
                >
                  <Users className="w-10 h-10" style={{ color: MAROON }} />
                </div>
                <p className="text-lg font-bold text-slate-700">
                  {userRoleFilter === "all" ? "No users yet" : `No ${userRoleFilter}s found`}
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                  {userRoleFilter === "all" ? "Users will appear here once they sign up." : "Try selecting another filter above."}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Route Moderation — Community Routes */}
        {activeTab === "routes" && (
          <motion.div
            custom={0}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl overflow-hidden border border-slate-200/60"
            style={{
              boxShadow: "0 0 0 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 12px 24px rgba(15,23,42,0.08)",
            }}
          >
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${MAROON} 0%, #a0155e 100%)` }}
            />
            <div
              className="px-6 sm:px-8 py-6 border-b border-slate-100"
              style={{ background: "linear-gradient(180deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,1) 100%)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${MAROON} 0%, #a0155e 100%)`,
                      boxShadow: `0 4px 12px ${MAROON}40`,
                    }}
                  >
                    <Route className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Community Routes</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Review and moderate user-contributed routes</p>
                  </div>
                </div>
                {loadingRoutes && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: MAROON }} />
                    <span>Loading…</span>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-200/80">
                    <th className="px-6 py-4 pl-8">Route</th>
                    <th className="px-6 py-4">Creator</th>
                    <th className="px-6 py-4">Distance</th>
                    <th className="px-6 py-4 pr-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r, idx) => (
                    <motion.tr
                      key={r._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`group border-b border-slate-100 transition-all duration-200 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      } hover:bg-[#80134D]/[0.06] hover:border-l-4 hover:border-l-[#80134D]`}
                      style={{ borderLeftColor: "transparent" }}
                    >
                      <td className="px-6 py-4 pl-8">
                        <div className="flex flex-col gap-2 max-w-md">
                          <div
                            className="px-3 py-2 rounded-xl border shadow-sm"
                            style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5f5" }}
                            title={r.startLocation}
                          >
                            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">From</span>
                            <p className="text-sm font-medium text-slate-800 mt-0.5 truncate whitespace-nowrap overflow-hidden">
                              {r.startLocation}
                            </p>
                          </div>
                          <div
                            className="px-3 py-2 rounded-xl border shadow-sm"
                            style={{ backgroundColor: "#fef2f8", borderColor: "#f9a8d4" }}
                            title={r.endLocation}
                          >
                            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">To</span>
                            <p className="text-sm font-medium text-slate-800 mt-0.5 truncate whitespace-nowrap overflow-hidden">
                              {r.endLocation}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <p className={`font-semibold tracking-tight ${(r.creatorId?.name || r.creatorId?.email || r.creator?.name || r.creator?.email) ? "" : "text-slate-400 italic font-normal"}`} style={(r.creatorId?.name || r.creatorId?.email || r.creator?.name || r.creator?.email) ? { color: MAROON } : undefined}>
                            {(r.creatorId?.name || r.creatorId?.email || r.creator?.name || r.creator?.email) || "—"}
                          </p>
                          {(r.creatorId?._id || r.creator?._id) && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono truncate max-w-[240px] border shadow-sm" style={{ backgroundColor: `${MAROON}12`, borderColor: `${MAROON}40`, color: MAROON }} title={String(r.creatorId?._id || r.creator?._id)}>
                              ID: {String(r.creatorId?._id || r.creator?._id)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.distance ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/80">
                            {typeof r.distance === "number" ? `${r.distance} km` : r.distance}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 pr-8 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRoute(r)}
                          disabled={actioning === r._id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md border border-red-200/60 text-sm font-semibold disabled:opacity-50 transition-all duration-200"
                        >
                          {actioning === r._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {routes.length === 0 && !loadingRoutes && (
              <div className="py-20 px-8 text-center">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 opacity-90"
                  style={{ background: `linear-gradient(135deg, ${MAROON}18 0%, ${MAROON}08 100%)` }}
                >
                  <Route className="w-10 h-10" style={{ color: MAROON }} />
                </div>
                <p className="text-lg font-bold text-slate-700">No community routes</p>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                  Routes shared by users will appear here for moderation.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Payout Management */}
        {activeTab === "payouts" && (
          <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible" className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Calculate payouts for month:</span>
              <input
                type="month"
                value={payoutMonth}
                onChange={(e) => setPayoutMonth(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCalculatePayouts}
                disabled={calculating}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: MAROON }}
              >
                {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Calculate Payouts
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Payout Management</h2>
                {loadingPayouts && <Loader2 className="w-5 h-5 animate-spin" style={{ color: MAROON }} />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3">Partner</th>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Tokens Redeemed</th>
                      <th className="px-4 py-3">Amount (LKR)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{p.partnerId?.shopName || p.partnerId?.name || "—"}</p>
                          <p className="text-xs text-slate-400">{p.partnerId?.email}</p>
                        </td>
                        <td className="px-4 py-3">{p.month}</td>
                        <td className="px-4 py-3">{p.totalTokens}</td>
                        <td className="px-4 py-3 font-medium">{p.totalAmount?.toLocaleString()} LKR</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleProcessPayout(p)}
                              disabled={processingPayoutId === p._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                              style={{ backgroundColor: MAROON }}
                            >
                              {processingPayoutId === p._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                              Process Payout
                            </button>
                          )}
                          {p.status === "Paid" && p.transactionId && <span className="text-xs text-slate-400">{p.transactionId}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {payouts.length === 0 && !loadingPayouts && <p className="p-6 text-center text-slate-500">No payouts. Use &quot;Calculate Payouts&quot; for a month.</p>}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
