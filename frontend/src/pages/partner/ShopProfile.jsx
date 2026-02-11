/**
 * pages/partner/ShopProfile.jsx
 * --------------------------------------------------
 * Partner Shop Profile: two-column layout.
 * Left: Profile card (Cloudinary image, shop name, Status: Active).
 * Right: Edit form (Name, Description, Category, Phone).
 * Uses GET/PATCH /api/partner/profile and Cloudinary upload.
 * --------------------------------------------------
 */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Store,
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import {
  getPartnerProfile,
  updatePartnerProfile,
  uploadShopImage,
} from "../../services/partnerService";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const CATEGORIES = [
  "Cafe & Food",
  "Bike Shop",
  "Retail",
  "Services",
  "Other",
];

export default function ShopProfile() {
  const { user, token, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [form, setForm] = useState({
    shopName: "",
    location: "",
    category: "",
    phoneNumber: "",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    getPartnerProfile(token)
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setForm({
            shopName: data.shopName || "",
            location: data.location || "",
            category: data.category || "",
            phoneNumber: data.phoneNumber || "",
          });
        }
      })
      .catch(() => {
        if (!cancelled) setFormError("Failed to load profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!token || saving) return;
    setFormError("");
    setSaving(true);
    try {
      const updated = await updatePartnerProfile(token, {
        shopName: form.shopName.trim() || undefined,
        location: form.location.trim() || undefined,
        category: form.category.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        shopImageUrl: profile?.shopImageUrl,
      });
      setProfile((p) => (p ? { ...p, ...updated } : null));
      updateUser({
        shopName: updated.shopName,
        shopImage: updated.shopImageUrl,
      });
      showToast("Profile updated successfully.");
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (e.g. JPG, PNG).");
      return;
    }
    setUploadError("");
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      if (typeof base64 !== "string") {
        setUploadingImage(false);
        return;
      }
      try {
        const { url } = await uploadShopImage(token, base64);
        await updatePartnerProfile(token, {
          shopName: form.shopName.trim() || profile?.shopName,
          location: form.location.trim() || profile?.location,
          category: form.category.trim() || profile?.category,
          phoneNumber: form.phoneNumber.trim() || profile?.phoneNumber,
          shopImageUrl: url,
        });
        setProfile((p) => (p ? { ...p, shopImageUrl: url } : null));
        updateUser({ shopImage: url });
        showToast("Shop photo updated.");
      } catch (err) {
        setUploadError(
          err.response?.data?.message ||
            "Cloudinary upload failed. Please try again or use a different image."
        );
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const content = (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-5 pb-6 sm:pt-6 sm:pb-8">
      {/* Success / error toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
            toast.type === "success"
              ? "bg-primary text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </motion.div>
      )}

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="mb-4 sm:mb-5"
      >
        <h1 className="text-lg sm:text-xl font-bold text-slate-800">
          Shop Profile
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-500 max-w-xl">
          Manage redemptions, keep your details up to date and delight cyclists.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 lg:gap-8 items-end">
        {/* Left: Profile card */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="relative rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950/95 border border-white/8 shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden px-6 py-7 sm:px-8 sm:py-9 flex flex-col justify-between"
        >
          {/* Soft glow header */}
          <div className="absolute -top-40 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-4 sm:mb-5">
              <div className="rounded-full p-[3px] sm:p-1 bg-[conic-gradient(at_top,_theme(colors.primary.400),_#f97316,_theme(colors.primary.500),_#22c55e,_theme(colors.primary.400))] shadow-[0_0_40px_rgba(248,113,113,0.75)]">
                <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full bg-slate-900/90 border border-white/10 overflow-hidden flex items-center justify-center">
                  {profile?.shopImageUrl ? (
                    <img
                      src={profile.shopImageUrl}
                      alt="Shop"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-14 h-14 text-white/60" />
                  )}
                </div>
              </div>

              <label className="absolute bottom-1 right-1 flex items-center justify-center w-10 h-10 rounded-full bg-primary shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-white cursor-pointer hover:bg-primary/90 transition-colors">
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImagePlus className="w-5 h-5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingImage}
                  onChange={handleImageSelect}
                />
              </label>
            </div>

            {uploadError && (
              <p className="mb-2 text-xs text-red-300 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}

            <h2 className="text-lg sm:text-xl font-semibold text-white truncate max-w-full px-4">
              {profile?.shopName || "Delight Kitchen"}
            </h2>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/90 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Status: Active
            </span>
          </div>

          <div className="relative mt-6 text-xs sm:text-sm text-white/60 leading-relaxed hidden sm:block">
            Your monthly stand is spot for users and can be used to redeem
            items and limited‑edition designs for daily visits to your
            bike‑friendly rewards.
          </div>
        </motion.div>

        {/* Right: Edit form */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-100/80 shadow-[0_20px_60px_rgba(15,23,42,0.45)] p-6 sm:p-7 lg:p-8"
        >
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Shop Details
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Shop Name
              </label>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shopName: e.target.value }))
                }
                placeholder="Delight Kitchen"
                className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Location / City
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="e.g. Gampaha, Colombo"
                className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                }
                placeholder="071 983 9270"
                className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold py-3 shadow-[0_14px_40px_rgba(136,16,83,0.65)] hover:bg-primary/90 disabled:opacity-60 disabled:shadow-none transition-all"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );

  if (loading) {
    // Loading skeleton on plain light background, aligned towards top
    return (
      <div className="min-h-[80vh] bg-white">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-5 pb-6 sm:pt-6 sm:pb-8">
          <div className="h-6 w-40 bg-slate-200/80 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 lg:p-8">
              <div className="h-40 w-40 lg:h-52 lg:w-52 mx-auto rounded-full bg-slate-100 animate-pulse mb-4" />
              <div className="h-5 w-32 mx-auto bg-slate-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 mx-auto bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 lg:p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-[80vh] bg-white">{content}</div>;
}
