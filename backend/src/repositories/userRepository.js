/**
 * src/repositories/userRepository.js — DB access for User (Clean Architecture).
 * All User reads/writes go through this layer for testability and single responsibility.
 */

import User from "../models/User.js";

/**
 * Find user by id with optional field selection.
 * @param {import('mongoose').Types.ObjectId} id
 * @param {string} [select]
 * @returns {Promise<import('mongoose').Document|null>}
 */
export async function findById(id, select = "") {
  return User.findById(id).select(select).exec();
}

/**
 * Get only bank details for a user (for GET /api/partner/bank-details).
 */
export async function getBankDetails(userId) {
  const user = await User.findById(userId).select("bankDetails").lean().exec();
  return user?.bankDetails || null;
}

/**
 * Update partner bank details (full or partial). Only set provided fields.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {{ bankName?: string, branchName?: string, accountNo?: string, accountHolderName?: string }} data
 */
export async function updateBankDetails(userId, data) {
  const user = await User.findById(userId);
  if (!user) return null;
  if (!user.bankDetails) user.bankDetails = {};
  if (data.bankName !== undefined) user.bankDetails.bankName = String(data.bankName).trim();
  if (data.branchName !== undefined) user.bankDetails.branchName = String(data.branchName).trim();
  if (data.accountNo !== undefined) user.bankDetails.accountNo = String(data.accountNo).trim();
  if (data.accountHolderName !== undefined) user.bankDetails.accountHolderName = String(data.accountHolderName).trim();
  await user.save();
  return user;
}

/**
 * Clear bank details (set all to empty string).
 */
export async function clearBankDetails(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  user.bankDetails = {
    bankName: "",
    branchName: "",
    accountNo: "",
    accountHolderName: "",
  };
  await user.save();
  return user;
}
