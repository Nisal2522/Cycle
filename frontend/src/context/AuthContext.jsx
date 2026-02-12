/**
 * context/AuthContext.jsx
 * --------------------------------------------------
 * Global authentication state using React Context API.
 *
 * Provides:
 *   - user        : { _id, name, email, role } | null
 *   - token       : string | null — JWT token
 *   - loading     : boolean       — true during auth requests
 *   - error       : string        — latest error message
 *   - register    : async (name, email, password, role?) → boolean
 *   - login       : async (email, password) → boolean
 *   - logout      : () → void
 *   - clearError  : () → void
 *
 * Roles: "cyclist" | "partner" | "admin"
 *
 * On mount, checks localStorage for an existing session
 * so the user stays logged in across page refreshes.
 *
 * Usage:
 *   Wrap <App /> with <AuthProvider> in main.jsx
 *   Access state via the useAuth() custom hook
 * --------------------------------------------------
 */

import { createContext, useState, useEffect, useCallback } from "react";
import { registerUser, loginUser, googleLogin as googleLoginApi, updateProfile as updateProfileApi, uploadAvatar as uploadAvatarApi } from "../services/authService";

// Keys used for localStorage persistence
const STORAGE_KEYS = {
  TOKEN: "cyclelink_token",
  USER: "cyclelink_user",
};

// Create context
export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Restore session from localStorage on mount ──
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, []);

  /**
   * Save auth data to state and localStorage.
   * Includes role + partner metadata when present.
   */
  const saveSession = useCallback((data) => {
    const userData = {
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role || "cyclist",
      shopName: data.shopName || null,
      shopImage: data.shopImage ?? data.shopImageUrl ?? "",
      profileImage: data.profileImage ?? "",
      partnerTotalRedemptions: data.partnerTotalRedemptions || 0,
    };

    setToken(data.token);
    setUser(userData);

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }, []);

  /**
   * Register a new user.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} [role="cyclist"]
   * @returns {boolean} true on success, false on failure
   */
  const register = useCallback(
    async (name, email, password, role = "cyclist", shopName) => {
      setLoading(true);
      setError("");

      try {
        const data = await registerUser(name, email, password, role, shopName);
        saveSession(data);
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  /**
   * Log in an existing user.
   * @returns {boolean} true on success, false on failure
   */
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError("");

      try {
        const data = await loginUser(email, password);
        saveSession(data);
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  /**
   * Log in with Google credential (ID token from @react-oauth/google).
   * @param {string} credential
   * @returns {Promise<boolean>} true on success, false on failure
   */
  const loginWithGoogle = useCallback(
    async (credential) => {
      setLoading(true);
      setError("");

      try {
        const data = await googleLoginApi(credential);
        saveSession(data);
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  /**
   * Log out — clears state and localStorage.
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  /**
   * Clear the current error message.
   */
  const clearError = useCallback(() => setError(""), []);

  /**
   * Update user in state and localStorage (e.g. after shop profile edit or avatar upload).
   */
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      return next;
    });
  }, []);

  /**
   * Upload profile image and update user in state.
   * @param {string} base64DataUri — data:image/...;base64,...
   */
  const uploadProfileImage = useCallback(
    async (base64DataUri) => {
      if (!token) return null;
      const data = await uploadAvatarApi(token, base64DataUri);
      const url = data?.url || data?.profileImage;
      if (url) {
        updateUser({ profileImage: url });
        return url;
      }
      return null;
    },
    [token, updateUser]
  );

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    clearError,
    updateUser,
    updateProfile: updateProfileApi,
    uploadProfileImage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
