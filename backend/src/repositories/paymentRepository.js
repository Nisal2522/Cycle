/**
 * repositories/paymentRepository.js
 * --------------------------------------------------
 * DB access for Payment model (Controller-Service-Repository pattern).
 */

import Payment from "../models/Payment.js";

/**
 * @param {{ userId: string, transactionId: string, amount: number, currency?: string, status: string, productName?: string }} data
 */
export async function createPayment(data) {
  return Payment.create(data);
}

export async function findByTransactionId(transactionId) {
  return Payment.findOne({ transactionId }).exec();
}

/**
 * Upsert payment by transactionId (for webhook and confirm-session).
 */
export async function upsertPayment(transactionId, payload) {
  return Payment.findOneAndUpdate(
    { transactionId },
    { $set: payload },
    { upsert: true, new: true }
  ).exec();
}
