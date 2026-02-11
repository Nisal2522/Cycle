/**
 * config/nav.js
 * --------------------------------------------------
 * Shared navigation config for Sidebar and Navbar.
 * Single source of truth so navbar shows the same items as sidebar.
 */

import {
  Home,
  Map,
  MapPin,
  Award,
  Clock,
  Trophy,
  CloudSun,
  Store,
  QrCode,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Users,
  Activity,
  Settings,
} from "lucide-react";

/** Role-specific navigation (same as sidebar) */
export const ROLE_NAV = {
  cyclist: [
    { label: "Overview", to: "/dashboard", icon: Home },
    { label: "Map (Routes)", to: "/dashboard/routes", icon: Map },
    { label: "Live Map", to: "/dashboard/map", icon: MapPin },
    { label: "My Rewards", to: "/dashboard/rewards", icon: Award },
    { label: "Trip History", to: "/dashboard/history", icon: Clock },
    { label: "Leaderboard", to: "/dashboard/leaderboard", icon: Trophy },
    { label: "Weather", to: "/dashboard/weather", icon: CloudSun },
  ],
  partner: [
    { label: "Overview", to: "/partner-dashboard", icon: Home },
    { label: "Shop Profile", to: "/partner-dashboard/shop-profile", icon: Store },
    { label: "Redemption Scanner", to: "/partner-dashboard", icon: QrCode },
    { label: "Earnings", to: "/partner-dashboard/earnings", icon: DollarSign },
    { label: "Promo Manager", to: "/partner-dashboard", icon: Megaphone },
  ],
  admin: [
    { label: "Dashboard", to: "/admin-panel", icon: ShieldCheck },
    { label: "User Management", to: "/admin-panel", icon: Users },
    { label: "Route Moderation", to: "/admin-panel", icon: Activity },
    { label: "Payout Management", to: "/admin-panel", icon: DollarSign },
  ],
};

/** Shared links (Landing Page, Settings) */
export const SHARED_NAV = [
  { label: "Landing Page", to: "/", icon: Home },
  { label: "Settings", to: "/settings", icon: Settings },
];

/**
 * Get nav items to show in navbar when user is logged in (sidebar items).
 */
export function getNavLinksForRole(role) {
  const roleLinks = ROLE_NAV[role] || ROLE_NAV.cyclist;
  return [...roleLinks, ...SHARED_NAV];
}
