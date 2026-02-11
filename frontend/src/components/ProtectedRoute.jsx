/**
 * ProtectedRoute.jsx
 * --------------------------------------------------
 * A wrapper component that guards routes based on
 * authentication status and user role.
 *
 * Behaviour:
 *   1. Not logged in → redirect to /login
 *   2. Logged in but wrong role → redirect to their
 *      own dashboard (prevents accessing others' panels)
 *   3. Logged in with correct role → render children
 *
 * Props:
 *   - allowedRoles : string[] — roles that can access
 *                    this route, e.g. ["admin"]
 *   - children     : ReactNode — the page to render
 *
 * Usage:
 *   <Route
 *     path="/admin-panel"
 *     element={
 *       <ProtectedRoute allowedRoles={["admin"]}>
 *         <AdminDashboard />
 *       </ProtectedRoute>
 *     }
 *   />
 * --------------------------------------------------
 */

import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getDashboardPath } from "../config/roles";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user } = useAuth();
  const location = useLocation();

  // ── Not authenticated → redirect to login ──
  // Save the attempted URL so we can redirect back after login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Authenticated but role not allowed → redirect to own dashboard ──
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  // ── Authorized → render the page ──
  return children;
}
