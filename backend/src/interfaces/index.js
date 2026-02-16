/**
 * src/interfaces/ — JSDoc types / shared type definitions.
 * Use for @typedef in services/controllers or TypeScript later.
 */

/**
 * @typedef {Object} ApiSuccess
 * @property {boolean} success
 * @property {string} [message]
 * @property {*} [data]
 */

/**
 * @typedef {Object} ApiError
 * @property {boolean} success
 * @property {string} message
 */

/**
 * @typedef {Object} Pagination
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 */
