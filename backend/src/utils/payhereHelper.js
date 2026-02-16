/**
 * src/utils/payhereHelper.js — PayHere notify_url verification (Requirement iv).
 */
import crypto from "crypto";

const PAYHERE_SECRET = process.env.PAYHERE_SECRET;

export function verifyNotifyPayload(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Missing or invalid body" };
  }
  if (!PAYHERE_SECRET || String(PAYHERE_SECRET).trim() === "") {
    return { valid: false, error: "PayHere not configured" };
  }
  const receivedSig = String(body.md5sig ?? "").trim().toLowerCase();
  if (!receivedSig) return { valid: false, error: "Missing md5sig" };
  const secret = String(PAYHERE_SECRET).trim();
  const str =
    String(body.merchant_id ?? "").trim() +
    String(body.order_id ?? "").trim() +
    String(body.payhere_amount ?? "").trim() +
    String(body.payhere_currency ?? "").trim() +
    String(body.status_code ?? "").trim() +
    secret;
  const expectedSig = crypto.createHash("md5").update(str, "utf8").digest("hex").toLowerCase();
  return receivedSig === expectedSig ? { valid: true } : { valid: false, error: "MD5 signature mismatch" };
}
