/**
 * features/auth/ProtectedRoute.jsx
 * --------------------------------------------------
 * Role-Based Access Control (RBAC) — Requirement iv.
 *
 * - Checks valid JWT (in localStorage) and stored user for role.
 * - Redirects to /login if not authenticated.
 * - Redirects to /unauthorized if role is not in allowedRoles.
 *
 * Clean Architecture: auth feature owns route protection logic.
 * --------------------------------------------------
 */

import { Navigate, useLocation } from "react-router-dom";
import { TOKEN_KEY, USER_KEY } from "../../constants/auth";
import useAuth from "../../hooks/useAuth";

/**
 * Read stored user from localStorage (sync with AuthContext hydration).
 */
function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check if a valid token exists in localStorage.
 */
function hasStoredToken() {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return typeof t === "string" && t.trim().length > 0;
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const { user: contextUser } = useAuth();

  // Prefer localStorage so that after logout or new-user login we don't use stale context.
  // Token must be in localStorage (logout clears it); user from storage or context.
  const storedUser = getStoredUser();
  const user = storedUser ?? contextUser;
  const hasToken = hasStoredToken();
  const isAuthenticated = hasToken && user;

  // Not authenticated → redirect to login, preserve attempted URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalise role to lowercase so "Partner" / "partner" both work; default cyclist if missing/invalid
  const rawRole = user?.role;
  const role = (rawRole && String(rawRole).toLowerCase()) || "cyclist";
  const allowedRole = ["cyclist", "partner", "admin"].includes(role) ? role : "cyclist";

  // Authenticated but role not allowed → show Unauthorized (RBAC)
  if (allowedRoles.length > 0 && !allowedRoles.includes(allowedRole)) {
    return <Navigate to="/unauthorized" state={{ from: location, role: allowedRole }} replace />;
  }

  return children;
}
