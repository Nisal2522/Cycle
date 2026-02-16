/**
 * src/middleware/errorHandler.js — Global error handling (Requirement iv & v).
 * Logs Stripe-specific errors for debugging (Requirement v).
 */
const notFound = (req, res, next) => {
  const error = new Error("Not found — " + req.originalUrl);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const isStripeError = err.type === "StripeError" || (err.message && String(err.message).toLowerCase().includes("stripe"));
  if (isStripeError) {
    console.error("[Stripe] Payment error:", err.message || err);
    if (err.stack) console.error(err.stack);
  }
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.statusCode) statusCode = err.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export { notFound, errorHandler };
