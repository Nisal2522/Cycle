/**
 * Sidebar.jsx
 * --------------------------------------------------
 * Vertical sticky sidebar with Role-Based Access Control.
 *
 * Layout:
 *   Desktop (md+): Fixed left sidebar, expandable/collapsible
 *   Mobile (<md) : Hidden — mobile uses MobileBottomNav instead
 *
 * Sections (top → bottom):
 *   1. Logo / Brand
 *   2. Role-specific nav links
 *   3. Shared links (Home, Settings)
 *   4. Divider
 *   5. User profile card + Logout
 *
 * Active state:
 *   - Emerald green (#10b981) background tint + 2px left border
 *
 * Collapse behaviour:
 *   - Collapsed: 72px wide, icons only, tooltips on hover
 *   - Expanded: 256px wide, icons + labels
 *   - Smooth Framer Motion width animation
 *
 * Props: none (reads role from useAuth context)
 * --------------------------------------------------
 */

import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  Home,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  // Cyclist
  Map,
  MapPin,
  Award,
  Clock,
  Trophy,
  CloudSun,
  // Partner
  Store,
  QrCode,
  DollarSign,
  Megaphone,
  // Admin
  ShieldCheck,
  Users,
  Activity,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import useSidebar from "../hooks/useSidebar";
import { ROLE_LABELS, getDashboardPath } from "../config/roles";
import { ROLE_NAV, SHARED_NAV } from "../config/nav";
import { ChatUnreadContext } from "../context/ChatUnreadContext";

/** Shared links: Landing Page first, then Settings */
const SHARED_TOP = SHARED_NAV.filter((item) => item.to === "/");
const SHARED_BOTTOM = SHARED_NAV.filter((item) => item.to === "/settings");

/* ──────────────────────────────────────────────
   Sidebar widths
   ────────────────────────────────────────────── */
const EXPANDED_W = 256; // px
const COLLAPSED_W = 72; // px

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

/** Single navigation link with optional tooltip and optional badge */
function NavItem({ item, isActive, collapsed, badge = 0 }) {
  const Icon = item.icon;

  return (
    <div className="relative group">
      <Link
        to={item.to}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative ${
          isActive
            ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-l-2 border-transparent pl-[10px]"
        }`}
      >
        <span className="relative shrink-0">
          <Icon
            className={`w-[20px] h-[20px] ${
              isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
            }`}
          />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Tooltip (collapsed only) */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {item.label}
          {badge > 0 && ` (${badge})`}
          {/* Arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-slate-900" />
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Sidebar component
   ────────────────────────────────────────────── */

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { collapsed, toggle, sidebarWidth } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useContext(ChatUnreadContext);

  const role = user?.role || "cyclist";
  const roleLinks = ROLE_NAV[role] || ROLE_NAV.cyclist;
  const roleLabel = ROLE_LABELS[role] || "User";
  // Always show signup name as the main user display
  const displayName = user?.name;
  const userInitial = (displayName || user?.name || "U")
    .charAt(0)
    .toUpperCase();

  // Exact match: pathname + search (so admin ?tab= links work). When multiple items share the same to, only the first is active.
  const currentFull = location.pathname + (location.search || "");
  const isActive = (item, index) => {
    if (currentFull !== item.to) return false;
    if (index === undefined) return true;
    const firstWithPath = roleLinks.findIndex((link) => link.to === item.to);
    return index === firstWithPath;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-slate-200/80 overflow-hidden"
    >
      {/* ── Logo + Collapse toggle ── */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-slate-100">
        <Link to={getDashboardPath(role)} className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap overflow-hidden"
              >
                Cycle<span className="text-primary">Link</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={toggle}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-3 py-4">
        {/* Role label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 px-3 mb-2"
            >
              {roleLabel}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Role-specific links */}
        <div className="space-y-2.5">
          {roleLinks.map((item, index) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={isActive(item, index)}
              collapsed={collapsed}
              badge={item.label === "Messages" ? totalUnread : 0}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="my-5 mx-3 border-t border-slate-100" />

        {/* Shared links */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 px-3 mb-2"
            >
              General
            </motion.p>
          )}
        </AnimatePresence>

        <div className="space-y-2.5">
          {SHARED_TOP.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={isActive(item, undefined)}
              collapsed={collapsed}
            />
          ))}
          {SHARED_BOTTOM.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={isActive(item, undefined)}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Push profile card to bottom */}
        <div className="flex-1" />
      </nav>

      {/* ── User profile + Logout ── */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        {/* Profile card */}
        <div
          className={`flex items-center gap-3 rounded-xl p-2.5 bg-slate-50 mb-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {/* Avatar */}
          <div className="relative group">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
              {userInitial}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-white rounded-full" />

            {/* Tooltip (collapsed only) */}
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {displayName || "User"}
                <span className="block text-[10px] text-slate-400 capitalize">{roleLabel}</span>
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-slate-900" />
              </div>
            )}
          </div>

          {/* Name + Role (expanded only) */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {displayName || "User"}
                </p>
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {roleLabel}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout button */}
        <div className="relative group">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-[20px] h-[20px] shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Tooltip (collapsed only) */}
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Log Out
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-slate-900" />
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

