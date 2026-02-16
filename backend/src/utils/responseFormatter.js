/**
 * src/utils/responseFormatter.js — Consistent API responses (Requirement v, SOLID).
 */

/**
 * Success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 */
export function success(res, data = null, message = "Success", statusCode = 200) {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

/**
 * Paginated success response.
 */
export function paginated(res, items, total, page, limit, message = "Success") {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  });
}

/**
 * Error response (prefer throwing errors and using global error handler; use this when controller must send error directly).
 */
export function error(res, message = "Error", statusCode = 500) {
  return res.status(statusCode).json({ success: false, message });
}
