/**
 * middleware/errorMiddleware.js
 * --------------------------------------------------
 * Centralised error handling middleware for Express.
 *
 * Two middleware functions:
 *   1. notFound   — catches 404 for undefined routes
 *   2. errorHandler — catches all thrown/next(err) errors
 *                     and returns a consistent JSON shape
 *
 * Response shape:
 *   {
 *     message: "Human-readable error message",
 *     stack: "..." (only in development)
 *   }
 * --------------------------------------------------
 */

/**
 * 404 handler — runs when no route matched.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler — catches all errors.
 * Ensures we always return JSON (never HTML error pages).
 */
const errorHandler = (err, req, res, next) => {
  // If status is still 200, change to 500 (default server error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    // Only include stack trace in development
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export { notFound, errorHandler };
