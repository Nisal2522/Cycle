/**
 * middleware/aiRateLimiter.js
 * --------------------------------------------------
 * In-memory per-IP rate limit for AI chat to avoid hitting Gemini quota.
 * Limits: 6 requests per 60 seconds per IP.
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 6;
const store = new Map();

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

export function aiRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(ip, entry);
  } else {
    entry.count += 1;
  }

  if (entry.count > MAX_REQUESTS) {
    res.status(429);
    return res.json({
      message: "Daily limit reached or too many requests. Please wait 60 seconds.",
    });
  }

  next();
}
