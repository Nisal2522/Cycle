/**
 * pages/partner/PartnerScanPage.jsx
 * --------------------------------------------------
 * QR Scanner for partners: camera + file upload, parse redemption JSON,
 * show confirmation card, confirm checkout via POST /api/redeem/confirm.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Camera,
  Upload,
  User,
  Coins,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { confirmRedeem, getPartnerCheckouts } from "../../services/partnerService";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

const SCANNER_ELEMENT_ID = "partner-qr-reader";

function parseQrPayload(decodedText) {
  try {
    const data = JSON.parse(decodedText);
    if (
      data &&
      typeof data.transactionId !== "undefined" &&
      typeof data.cyclistId !== "undefined" &&
      typeof data.tokenAmount !== "undefined"
    ) {
      return {
        transactionId: data.transactionId,
        mealName: data.mealName ?? data.rewardTitle ?? "",
        tokenAmount: Number(data.tokenAmount) || 0,
        cyclistName: data.cyclistName ?? "",
        cyclistId: data.cyclistId,
        expiryTime: data.expiryTime || null,
      };
    }
  } catch (_) {}
  return null;
}

function validatePayload(payload) {
  if (!payload || payload.tokenAmount <= 0) return { valid: false, error: "Invalid QR code data" };
  if (payload.expiryTime) {
    const expiry = new Date(payload.expiryTime);
    if (Number.isNaN(expiry.getTime()) || expiry < new Date()) {
      return { valid: false, error: "This QR code has expired" };
    }
  }
  return { valid: true };
}

export default function PartnerScanPage() {
  const { token } = useAuth();
  const [mode, setMode] = useState("camera"); // "camera" | "file"
  const [scanned, setScanned] = useState(null); // parsed payload or null
  const [scanError, setScanError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [checkoutsPage, setCheckoutsPage] = useState(1);
  const [checkoutsData, setCheckoutsData] = useState({ checkouts: [], total: 0, totalPages: 1 });
  const [loadingCheckouts, setLoadingCheckouts] = useState(false);
  const html5QrRef = useRef(null);
  const scannerStarted = useRef(false);
  const fileInputRef = useRef(null);
  const [scanningFile, setScanningFile] = useState(false);

  const fetchCheckouts = useCallback(async () => {
    if (!token) return;
    setLoadingCheckouts(true);
    try {
      const data = await getPartnerCheckouts(token, { page: checkoutsPage, limit: 1 });
      setCheckoutsData({
        checkouts: data.checkouts || [],
        total: data.total ?? 0,
        totalPages: data.totalPages ?? 1,
      });
    } catch {
      setCheckoutsData({ checkouts: [], total: 0, totalPages: 1 });
    } finally {
      setLoadingCheckouts(false);
    }
  }, [token, checkoutsPage]);

  useEffect(() => {
    fetchCheckouts();
  }, [fetchCheckouts]);

  useEffect(() => {
    if (!confirmSuccess || !token) return;
    setCheckoutsPage(1);
    getPartnerCheckouts(token, { page: 1, limit: 1 })
      .then((data) =>
        setCheckoutsData({
          checkouts: data.checkouts || [],
          total: data.total ?? 0,
          totalPages: data.totalPages ?? 1,
        })
      )
      .catch(() => {})
      .finally(() => setConfirmSuccess(false));
  }, [confirmSuccess, token]);

  const stopCamera = useCallback(async () => {
    if (!html5QrRef.current || !scannerStarted.current) return;
    try {
      await html5QrRef.current.stop();
      scannerStarted.current = false;
    } catch (e) {
      // ignore
    }
  }, []);

  const startCamera = useCallback(() => {
    if (!document.getElementById(SCANNER_ELEMENT_ID)) return;
    if (html5QrRef.current && scannerStarted.current) return;

    const html5Qr = new Html5Qrcode(SCANNER_ELEMENT_ID);
    html5QrRef.current = html5Qr;

    html5Qr
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const payload = parseQrPayload(decodedText);
          if (payload) {
            const { valid, error } = validatePayload(payload);
            if (valid) {
              setScanned(payload);
              setScanError("");
              stopCamera();
            } else {
              setScanError(error);
              toast.error(error);
            }
          } else {
            setScanError("Invalid QR code format");
            toast.error("Invalid QR code format");
          }
        },
        () => {}
      )
      .then(() => {
        scannerStarted.current = true;
      })
      .catch((err) => {
        setScanError("Camera access failed. Try uploading an image.");
        toast.error("Camera access failed");
        console.warn(err);
      });
  }, [stopCamera]);

  useEffect(() => {
    if (mode === "camera") {
      setScanError("");
      const t = setTimeout(() => startCamera(), 100);
      return () => {
        clearTimeout(t);
        const qr = html5QrRef.current;
        const wasStarted = scannerStarted.current;
        scannerStarted.current = false;
        html5QrRef.current = null;
        if (qr) {
          const safeClear = () => {
            try {
              const c = qr.clear();
              if (c && typeof c.catch === "function") c.catch(() => {});
            } catch (_) {}
          };
          if (wasStarted) {
            const p = qr.stop();
            if (p && typeof p.then === "function") {
              p.then(safeClear).catch(() => {});
            } else {
              safeClear();
            }
          } else {
            safeClear();
          }
        }
      };
    } else {
      const qr = html5QrRef.current;
      const wasStarted = scannerStarted.current;
      scannerStarted.current = false;
      html5QrRef.current = null;
      if (qr) {
        const safeClear = () => {
          try {
            const c = qr.clear();
            if (c && typeof c.catch === "function") c.catch(() => {});
          } catch (_) {}
        };
        if (wasStarted) {
          const p = qr.stop();
          if (p && typeof p.then === "function") {
            p.then(safeClear).catch(() => {});
          } else {
            safeClear();
          }
        } else {
          safeClear();
        }
      }
    }
  }, [mode, startCamera, stopCamera]);

  const handleFileSelect = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setScanError("");
    setScanningFile(true);
    if (!document.getElementById(SCANNER_ELEMENT_ID)) {
      setScanningFile(false);
      toast.error("Scanner not ready. Try again.");
      e.target.value = "";
      return;
    }

    const html5Qr = new Html5Qrcode(SCANNER_ELEMENT_ID);
    html5Qr
      .scanFile(file, false)
      .then((decodedText) => {
        const payload = parseQrPayload(decodedText);
        if (payload) {
          const { valid, error } = validatePayload(payload);
          if (valid) {
            setScanned(payload);
            setScanError("");
          } else {
            setScanError(error);
            toast.error(error);
          }
        } else {
          setScanError("Invalid QR code format");
          toast.error("Invalid QR code format");
        }
      })
      .catch(() => {
        setScanError("No clear QR code found in image");
        toast.error("No clear QR code found. Use a clear image of the redemption QR.");
      })
      .finally(() => {
        setScanningFile(false);
        e.target.value = "";
      });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmCheckout = async () => {
    if (!token || !scanned) return;
    setConfirming(true);
    try {
      await confirmRedeem(token, {
        transactionId: scanned.transactionId,
        mealName: scanned.mealName,
        tokenAmount: scanned.tokenAmount,
        cyclistName: scanned.cyclistName,
        cyclistId: scanned.cyclistId,
        expiryTime: scanned.expiryTime || undefined,
      });
      setConfirmSuccess(true);
      setScanned(null);
      toast.success("Checkout completed");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Checkout failed";
      setScanError(msg);
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const clearScanned = () => {
    setScanned(null);
    setScanError("");
    setConfirmSuccess(false);
    if (mode === "camera") setTimeout(() => startCamera(), 150);
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50">
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">QR Scanner</h1>
            <p className="text-sm text-slate-500">Scan cyclist redemption QR or upload an image</p>
          </div>
        </div>

        {/* Tabs: Camera | Upload */}
        <div className="flex rounded-xl bg-white border border-slate-200 p-1 mb-4">
          <button
            type="button"
            onClick={() => setMode("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "camera" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "file" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </button>
        </div>

        {scanError && !scanned && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-4"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </motion.div>
        )}

        {confirmSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm mb-4"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Checkout completed successfully.</span>
          </motion.div>
        )}

        {/* Hidden file input — triggered by Upload Image button via ref */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-hidden
          onChange={handleFileSelect}
        />

        {/* Scanner area: div must exist for both camera and file scan */}
        {!scanned && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white overflow-hidden mb-6 relative">
            <div
              id={SCANNER_ELEMENT_ID}
              className={mode === "camera" ? "min-h-[280px] w-full" : "sr-only"}
            />
            {mode === "file" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center min-h-[280px] p-6 z-10 bg-white">
                <Upload className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-sm font-medium text-slate-600 mb-1 text-center">Choose an image with a QR code</span>
                <span className="text-xs text-slate-400 mb-4">PNG, JPG or WebP</span>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={scanningFile}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 transition-colors shadow-sm"
                >
                  {scanningFile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation card */}
        <AnimatePresence mode="wait">
          {scanned ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-2xl border border-primary/20 bg-white shadow-lg overflow-hidden"
            >
              <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center justify-between">
                <span className="font-bold text-primary">Redemption details</span>
                <button
                  type="button"
                  onClick={clearScanned}
                  className="p-1.5 rounded-lg hover:bg-primary/20 text-primary"
                  aria-label="Clear and scan again"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="divide-y divide-slate-100 p-0">
                <li className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Meal / Reward</p>
                    <p className="text-slate-800 font-semibold">{scanned.mealName || "—"}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Cyclist</p>
                    <p className="text-slate-800 font-semibold">{scanned.cyclistName || "—"}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Tokens to deduct</p>
                    <p className="text-slate-800 font-bold text-primary">{scanned.tokenAmount} tokens</p>
                  </div>
                </li>
              </ul>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleConfirmCheckout}
                  disabled={confirming}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-70 transition-colors"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Checkout
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-slate-400"
            >
              {mode === "camera"
                ? "Point the camera at the cyclist's QR code"
                : "Upload an image containing the redemption QR code"}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Recent Checkouts — 1 record per page, professional table */}
        <section className="mt-8 sm:mt-10">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-800">Recent Checkouts</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                      Transaction ID
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                      Cyclist Name
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                      Item Name
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                      Tokens
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                      Date / Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCheckouts ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                        Loading…
                      </td>
                    </tr>
                  ) : checkoutsData.checkouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                        No checkouts yet. Complete a scan to see history here.
                      </td>
                    </tr>
                  ) : (
                    checkoutsData.checkouts.map((row) => (
                      <tr key={row.transactionId} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm font-mono text-slate-700 truncate max-w-[120px]" title={row.transactionId}>
                          {row.transactionId}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                          {row.cyclistName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {row.itemName}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                          {row.tokens}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {row.dateTime ? new Date(row.dateTime).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {checkoutsData.total > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Page {checkoutsPage} of {checkoutsData.totalPages}
                  {checkoutsData.total > 0 && (
                    <span className="ml-1">({checkoutsData.total} total)</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutsPage((p) => Math.max(1, p - 1))}
                    disabled={checkoutsPage <= 1 || loadingCheckouts}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutsPage((p) => Math.min(checkoutsData.totalPages, p + 1))}
                    disabled={checkoutsPage >= checkoutsData.totalPages || loadingCheckouts}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
