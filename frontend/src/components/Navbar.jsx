/**
 * Navbar.jsx
 * --------------------------------------------------
 * Sticky navigation bar with Glassmorphism effect.
 *
 * Dynamically renders navigation links based on context:
 *
 *   Guest (not logged in):
 *     [Logo] [Features] [Rewards] ·· [Sign In] [Get Started]
 *
 *   Cyclist:
 *     [Logo] [Dashboard] [My Tokens] [Safe Routes] ·· [Avatar] [Log Out]
 *
 *   Partner:
 *     [Logo] [Dashboard] [Scan QR] [Transactions] ·· [Avatar] [Log Out]
 *
 *   Admin:
 *     [Logo] [Dashboard] [Users] [Heatmaps] ·· [Avatar] [Log Out]
 *
 * Uses React Router for navigation (Link, useNavigate).
 * Uses the useAuth() hook to read authentication state.
 * --------------------------------------------------
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  ArrowRight,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getDashboardPath, ROLE_LABELS } from "../config/roles";
import { getNavLinksForRole } from "../config/nav";

/* ── Guest (landing) links ── */
const GUEST_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Rewards", href: "#how-it-works" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track scroll position for glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Get user-specific data: role links only (no Landing Page / Settings in navbar)
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";
  const allNavLinks = user ? getNavLinksForRole(user.role) : null;
  const navLinks = allNavLinks
    ? allNavLinks.filter((link) => link.to !== "/" && link.to !== "/settings")
    : null;
  const roleLabel = user ? (ROLE_LABELS[user.role] || "User") : null;

  // Is a given path the current active route?
  const isActive = (path) => location.pathname === path;

  // Determine if we're on the landing page (use hash links) or a dashboard (use router links)
  const isLandingPage = location.pathname === "/";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-white/20"
          : "bg-transparent"
      }`}
    >
      <nav className="relative max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16 md:h-18">
        {/* ── Left: Logo + Nav links ── */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Cycle<span className="text-primary">Link</span>
            </span>
          </Link>

          {/* Nav links (left side) */}
          <div className="hidden md:flex items-center gap-1">
          {user && navLinks ? (
            /* ── Authenticated: role-specific links ── */
            navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive(link.to)
                    ? "text-primary bg-primary/10"
                    : "text-slate-600 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {link.label}
              </Link>
            ))
          ) : isLandingPage ? (
            /* ── Guest on landing: hash links ── */
            GUEST_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full group-hover:w-full transition-all duration-300" />
              </a>
            ))
          ) : null}
          </div>
        </div>

        {/* ── Right corner: Auth buttons / User menu ── */}
        <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
          {user ? (
            <>
              {/* Role badge */}
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 bg-primary/5 px-2.5 py-1 rounded-full">
                {roleLabel}
              </span>

              {/* Avatar + Name */}
              <Link
                to={getDashboardPath(user.role)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {userInitial}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user.name}
                </span>
              </Link>

              {/* Log out */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </>
          ) : (
            <>
              {/* Guest: Sign In + Get Started */}
              <Link
                to="/login?mode=signin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                to="/login?mode=signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile menu toggle ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-white/90 backdrop-blur-xl border-b border-slate-200"
          >
            <div className="px-5 pb-5 pt-2 flex flex-col gap-1">
              {user && navLinks ? (
                <>
                  {/* Role badge */}
                  <div className="flex items-center gap-2 py-2 mb-1">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {roleLabel}
                    </span>
                  </div>

                  {/* Role-specific links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        isActive(link.to)
                          ? "text-primary bg-primary/10"
                          : "text-slate-700 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <hr className="my-2 border-slate-100" />

                  {/* User info + logout */}
                  <div className="flex items-center gap-2.5 py-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                      {userInitial}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  {/* Guest links */}
                  {isLandingPage &&
                    GUEST_LINKS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm font-medium text-slate-700 hover:text-primary px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-all"
                      >
                        {link.label}
                      </a>
                    ))}

                  <hr className="my-2 border-slate-100" />

                  <Link
                    to="/login?mode=signin"
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-primary rounded-lg hover:bg-primary/5 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 transition-all"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
