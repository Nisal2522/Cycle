/**
 * pages/SavedRoutesPage.jsx
 * --------------------------------------------------
 * Community saved routes — list of route cards with
 * Start/End, distance, duration, weather, and "View on Map".
 *
 * Accessible at: /dashboard/routes (Map (Routes) sidebar link)
 * --------------------------------------------------
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  MapPin,
  Route,
  Clock,
  ThermometerSun,
  Map,
  Loader2,
  AlertCircle,
  ExternalLink,
  User,
  Calendar,
  Pencil,
  Trash2,
  TriangleAlert,
  RefreshCw,
} from "lucide-react";
import { getRoutes, getMyRoutes, deleteRoute } from "../services/routeService";
import useAuth from "../hooks/useAuth";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SavedRoutesPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirmRoute, setDeleteConfirmRoute] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load approved routes + current user's pending/rejected so status (Live/Pending/Rejected) shows for own routes.
  // Refetch on focus so when admin approves a route, creator sees "Live" without leaving the page.
  const loadRoutes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const approved = await getRoutes().then((d) => (Array.isArray(d) ? d : []));
      if (!token) {
        setRoutes(approved);
        return;
      }
      const myRoutes = await getMyRoutes(token).then((d) => (Array.isArray(d) ? d : []));
      const approvedIds = new Set(approved.map((r) => String(r._id)));
      const myPendingOrRejected = myRoutes.filter((r) => r.status !== "approved" && r.status !== "");
      const combined = [...approved];
      myPendingOrRejected.forEach((r) => {
        if (!approvedIds.has(String(r._id))) combined.push(r);
      });
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRoutes(combined);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routes");
      setRoutes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // When user returns to this tab, refetch so they see status change to "Live" after admin approval.
  useEffect(() => {
    const onFocus = () => loadRoutes(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadRoutes]);

  const handleViewOnMap = (route) => {
    navigate("/dashboard/map", {
      state: {
        savedRoute: route,
        routeId: route._id,
        pathCoordinates: route.path,
      },
    });
  };

  const handleEditRoute = (route) => {
    navigate("/dashboard/map", {
      state: {
        savedRoute: route,
        isEditing: true,
      },
    });
  };

  const handleDeleteClick = (route) => {
    setDeleteConfirmRoute(route);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRoute || !token) return;
    setDeleting(true);
    try {
      await deleteRoute(token, deleteConfirmRoute._id);
      setRoutes((prev) => prev.filter((r) => r._id !== deleteConfirmRoute._id));
      setDeleteConfirmRoute(null);
      toast.success("Route deleted successfully", {
        style: { background: "#fdf2f8", border: "1px solid #fbcfe8", color: "#80134D" },
        iconTheme: { primary: "#80134D" },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete route", {
        style: { background: "#fdf2f8", border: "1px solid #fbcfe8", color: "#80134D" },
        iconTheme: { primary: "#80134D" },
      });
    } finally {
      setDeleting(false);
    }
  };

  const isOwnRoute = (route) => {
    const creatorId = route.creatorId?._id ?? route.creatorId;
    return creatorId && user?._id && String(creatorId) === String(user._id);
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "") return { label: "Live", className: "bg-emerald-100 text-emerald-700 border-emerald-200", showDot: true };
    if (s === "rejected") return { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200", showDot: false };
    return { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200", showDot: false };
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Route className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Map (Routes)</h1>
                <p className="text-sm text-slate-500">Community saved routes — plan and explore</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadRoutes(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors"
                title="Refresh to see latest status (e.g. Live after approval)"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/map")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Map className="w-4 h-4" />
                Open Live Map
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-6"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-slate-500">Loading routes...</p>
          </div>
        ) : routes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Route className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold mb-1">No routes yet</p>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              Save a route from the Live Map to share it with the community.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/map")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Map className="w-4 h-4" />
              Open Live Map
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {routes.map((route, i) => (
              <motion.article
                key={route._id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden hover:shadow-[0_14px_40px_rgba(135,16,83,0.12)] hover:border-primary/20 transition-all duration-300"
              >
                {/* Card accent bar — maroon/pink theme */}
                <div className="h-1.5 bg-primary" />

                <div className="p-4 sm:p-5">
                  {/* Status badge — Live = approved & visible to all; Pending = awaiting approval; Rejected = not published */}
                  {isOwnRoute(route) && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(route.status).className}`}>
                        {getStatusBadge(route.status).showDot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden />}
                        {getStatusBadge(route.status).label}
                      </span>
                    </div>
                  )}
                  {/* Start / End */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0 mt-0.5">
                        A
                      </span>
                      <p className="text-sm text-slate-700 line-clamp-2" title={route.startLocation}>
                        {route.startLocation}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0 mt-0.5">
                        B
                      </span>
                      <p className="text-sm text-slate-700 line-clamp-2" title={route.endLocation}>
                        {route.endLocation}
                      </p>
                    </div>
                  </div>

                  {/* Distance & Duration */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      <Route className="w-3.5 h-3.5" />
                      {route.distance}
                    </span>
                    {route.duration && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {route.duration}
                      </span>
                    )}
                  </div>

                  {/* Weather at destination (when saved) */}
                  {route.weatherCondition && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100">
                      <ThermometerSun className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{route.weatherCondition}</span>
                    </div>
                  )}

                  {/* Meta: creator & date */}
                  <div className="flex items-center justify-between gap-2 mb-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {route.creatorId?.name || "Cyclist"}
                    </span>
                    {route.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(route.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit & Delete (owner only) */}
                  {isOwnRoute(route) && (
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handleEditRoute(route)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors border border-primary/20"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(route)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
                        title="Delete route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* View on Map ── Maroon/Pink theme */}
                  <button
                    type="button"
                    onClick={() => handleViewOnMap(route)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Map
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Delete confirmation popup */}
        {deleteConfirmRoute && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 sm:p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <TriangleAlert className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Delete route?</h3>
                  <p className="text-sm text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                {deleteConfirmRoute.startLocation} → {deleteConfirmRoute.endLocation}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmRoute(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
