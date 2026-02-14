/**
 * controllers/rewardController.js
 * --------------------------------------------------
 * MVC Controller: Partner rewards & token redemption.
 *
 * - createReward       — POST   /api/rewards
 * - getPartnerRewards  — GET    /api/rewards/partner/:id
 * - updateReward       — PATCH  /api/rewards/:id
 * - deleteReward       — DELETE /api/rewards/:id
 * - redeemTokens       — PATCH  /api/tokens/redeem
 * --------------------------------------------------
 */

import Reward from "../models/Reward.js";
import User from "../models/User.js";
import Redemption from "../models/Redemption.js";

function ensurePartner(req, res) {
  if (!req.user || req.user.role !== "partner") {
    res.status(403);
    throw new Error("Only partners can perform this action");
  }
}

/**
 * @desc    Partner creates a new reward
 * @body    { title, description?, tokenCost, expiryDate? }
 */
export async function createReward(req, res) {
  ensurePartner(req, res);
  const { title, description, tokenCost, expiryDate } = req.body;

  const reward = await Reward.create({
    partnerId: req.user._id,
    title,
    description,
    tokenCost,
    expiryDate,
  });

  res.status(201).json(reward);
}

/**
 * @desc    Get rewards for a specific partner
 * @route   GET /api/rewards/partner/:id
 */
export async function getPartnerRewards(req, res) {
  ensurePartner(req, res);

  const { id } = req.params;

  // Partner can only view their own rewards (or admin in future)
  if (req.user.role === "partner" && req.user._id.toString() !== id) {
    res.status(403);
    throw new Error("You can only view your own rewards");
  }

  const rewards = await Reward.find({ partnerId: id, active: true }).sort({
    createdAt: -1,
  });
  res.json(rewards);
}

/**
 * @desc    Update a reward (title/description/tokenCost/expiry/active)
 * @route   PATCH /api/rewards/:id
 */
export async function updateReward(req, res) {
  ensurePartner(req, res);
  const { id } = req.params;

  const reward = await Reward.findById(id);
  if (!reward) {
    res.status(404);
    throw new Error("Reward not found");
  }

  if (reward.partnerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only update your own rewards");
  }

  const updatableFields = ["title", "description", "tokenCost", "expiryDate", "active"];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      reward[field] = req.body[field];
    }
  });

  await reward.save();
  res.json(reward);
}

/**
 * @desc    Delete (soft-delete) a reward
 * @route   DELETE /api/rewards/:id
 */
export async function deleteReward(req, res) {
  ensurePartner(req, res);
  const { id } = req.params;

  const reward = await Reward.findById(id);
  if (!reward) {
    res.status(404);
    throw new Error("Reward not found");
  }

  if (reward.partnerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete your own rewards");
  }

  reward.active = false;
  await reward.save();

  res.json({ message: "Reward archived", _id: id });
}

/**
 * @desc    Redeem cyclist tokens at a partner shop
 * @route   PATCH /api/tokens/redeem
 * @body    { cyclistId: string, tokens: number }
 */
export async function redeemTokens(req, res) {
  ensurePartner(req, res);
  const { cyclistId, tokens } = req.body;

  if (!cyclistId || !tokens || typeof tokens !== "number" || tokens <= 0) {
    res.status(400);
    throw new Error("cyclistId and positive tokens are required");
  }

  const cyclist = await User.findById(cyclistId);
  if (!cyclist || cyclist.role !== "cyclist") {
    res.status(404);
    throw new Error("Cyclist not found");
  }

  if (cyclist.tokens < tokens) {
    res.status(400);
    throw new Error("Cyclist does not have enough tokens");
  }

  cyclist.tokens -= tokens;
  await cyclist.save();

  // Track redemptions on partner profile
  const partner = await User.findById(req.user._id);
  if (partner) {
    partner.partnerTotalRedemptions =
      (partner.partnerTotalRedemptions || 0) + 1;
    await partner.save();
  }

  // Log redemption for monthly payout calculation
  await Redemption.create({
    partnerId: req.user._id,
    cyclistId: cyclist._id,
    tokens,
  });

  res.json({
    message: "Tokens redeemed successfully",
    redeemedTokens: tokens,
    cyclist: {
      _id: cyclist._id,
      name: cyclist.name,
      tokens: cyclist.tokens,
    },
    partner: {
      _id: partner?._id,
      shopName: partner?.shopName,
      partnerTotalRedemptions: partner?.partnerTotalRedemptions,
    },
  });
}

/**
 * @desc    Confirm checkout from scanned QR (transactionId, mealName, tokenAmount, cyclistId, cyclistName, expiryTime)
 * @route   POST /api/redeem/confirm
 * @body    { transactionId, mealName, tokenAmount, cyclistId, cyclistName, expiryTime }
 */
export async function confirmRedeem(req, res) {
  ensurePartner(req, res);
  const { transactionId, mealName, tokenAmount, cyclistId, cyclistName, expiryTime } = req.body;

  if (!transactionId || !cyclistId || tokenAmount == null) {
    res.status(400);
    throw new Error("transactionId, cyclistId, and tokenAmount are required");
  }

  const tokens = Number(tokenAmount);
  if (!Number.isFinite(tokens) || tokens <= 0) {
    res.status(400);
    throw new Error("tokenAmount must be a positive number");
  }

  // Already used?
  const existing = await Redemption.findOne({ transactionId });
  if (existing) {
    res.status(400);
    throw new Error("This QR code has already been used");
  }

  // Expired?
  if (expiryTime) {
    const expiry = new Date(expiryTime);
    if (Number.isNaN(expiry.getTime()) || expiry < new Date()) {
      res.status(400);
      throw new Error("This QR code has expired");
    }
  }

  const cyclist = await User.findById(cyclistId);
  if (!cyclist || cyclist.role !== "cyclist") {
    res.status(404);
    throw new Error("Cyclist not found");
  }

  if (cyclist.tokens < tokens) {
    res.status(400);
    throw new Error("Cyclist does not have enough tokens");
  }

  cyclist.tokens -= tokens;
  await cyclist.save();

  const partner = await User.findById(req.user._id);
  if (partner) {
    partner.partnerTotalRedemptions = (partner.partnerTotalRedemptions || 0) + 1;
    await partner.save();
  }

  await Redemption.create({
    partnerId: req.user._id,
    cyclistId: cyclist._id,
    tokens,
    transactionId,
    itemName: mealName || null,
  });

  res.status(200).json({
    message: "Checkout completed",
    status: "Completed",
    transactionId,
    redeemedTokens: tokens,
    cyclist: {
      _id: cyclist._id,
      name: cyclist.name,
      tokens: cyclist.tokens,
    },
  });
}

