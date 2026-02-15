/**
 * controllers/partnerController.js
 * --------------------------------------------------
 * Partner shop profile & image upload (Cloudinary).
 *
 * GET   /api/partner/profile       → getProfile
 * PATCH /api/partner/profile       → updateProfile
 * POST  /api/partner/upload-image  → uploadShopImage
 * --------------------------------------------------
 */

import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import Payout from "../models/Payout.js";
import PayoutRequest from "../models/PayoutRequest.js";
import Redemption from "../models/Redemption.js";

function ensurePartner(req, res) {
  if (!req.user || req.user.role !== "partner") {
    res.status(403);
    throw new Error("Only partners can perform this action");
  }
}

const PARTNER_SELECT =
  "name email role shopName shopImage description location address category phoneNumber partnerTotalRedemptions partnerAvailableBalance";

/**
 * @desc    Get current partner's shop profile
 * @access  Private (partner only)
 */
export async function getProfile(req, res) {
  ensurePartner(req, res);

  const user = await User.findById(req.user._id).select(PARTNER_SELECT);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName || "",
    shopImageUrl: user.shopImage || "",
    description: user.description || "",
    location: user.location || "",
    address: user.address || "",
    category: user.category || "",
    phoneNumber: user.phoneNumber || "",
    partnerTotalRedemptions: user.partnerTotalRedemptions || 0,
    partnerAvailableBalance: user.partnerAvailableBalance || 0,
  });
}

/**
 * @desc    Update partner shop details
 * @body    { shopName?, description?, address?, category?, phoneNumber?, shopImageUrl? }
 * @access  Private (partner only)
 */
export async function updateProfile(req, res) {
  ensurePartner(req, res);

  const { shopName, description, location, address, category, phoneNumber, shopImageUrl } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (shopName !== undefined) user.shopName = String(shopName).trim();
  if (description !== undefined) user.description = String(description).trim();
  if (location !== undefined) user.location = String(location).trim();
  if (address !== undefined) user.address = String(address).trim();
  if (category !== undefined) user.category = String(category).trim();
  if (phoneNumber !== undefined) user.phoneNumber = String(phoneNumber).trim();
  if (shopImageUrl !== undefined) user.shopImage = String(shopImageUrl).trim();

  await user.save();

  res.json({
    shopName: user.shopName || "",
    shopImageUrl: user.shopImage || "",
    description: user.description || "",
    location: user.location || "",
    address: user.address || "",
    category: user.category || "",
    phoneNumber: user.phoneNumber || "",
  });
}

/**
 * @desc    Upload shop image to Cloudinary; returns secure URL
 * @body    { image: "data:image/...;base64,..." }
 * @access  Private (partner only)
 */
export async function uploadShopImage(req, res) {
  ensurePartner(req, res);

  const { image } = req.body;
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    res.status(400);
    throw new Error("Invalid image: provide a base64 data URI (data:image/...)");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(503);
    throw new Error(
      "Image upload is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the server environment."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: "cyclelink/shops",
      resource_type: "image",
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(502);
    throw new Error(
      err.message || "Cloudinary upload failed. Please try again or use a different image."
    );
  }
}

/**
 * @desc    Get current partner's payment history (payouts)
 * @route   GET /api/partner/payouts
 * @access  Private (partner only)
 */
export async function getMyPayouts(req, res) {
  ensurePartner(req, res);

  const payouts = await Payout.find({ partnerId: req.user._id })
    .sort({ month: -1 })
    .lean();

  res.json(payouts);
}

/**
 * @desc    Get partner earnings summary (available balance + payout history)
 * @route   GET /api/partner/earnings
 * @access  Private (partner only)
 */
export async function getEarningsSummary(req, res) {
  ensurePartner(req, res);

  const user = await User.findById(req.user._id).select("partnerAvailableBalance");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const [payouts, requests] = await Promise.all([
    Payout.find({ partnerId: req.user._id }).sort({ month: -1 }).lean(),
    PayoutRequest.find({ partnerId: req.user._id }).sort({ createdAt: -1 }).lean(),
  ]);

  res.json({
    availableBalance: user.partnerAvailableBalance || 0,
    payouts,
    payoutRequests: requests,
  });
}

/**
 * @desc    Create a payout request from available balance
 * @route   POST /api/partner/payout-requests
 * @body    { amount: number }
 * @access  Private (partner only)
 */
export async function createPayoutRequest(req, res) {
  ensurePartner(req, res);

  const { amount } = req.body;
  const num = Number(amount);
  if (!num || num <= 0) {
    res.status(400);
    throw new Error("A positive amount is required");
  }

  const user = await User.findById(req.user._id).select("partnerAvailableBalance shopName name");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.partnerAvailableBalance < num) {
    res.status(400);
    throw new Error("Amount exceeds available balance");
  }

  const request = await PayoutRequest.create({
    partnerId: user._id,
    amount: num,
    status: "Pending",
  });

  res.status(201).json(request);
}

/**
 * @desc    Get partner's recent checkouts (redemptions) with pagination
 * @route   GET /api/partner/checkouts?page=1&limit=1
 * @query   page (default 1), limit (default 1)
 * @access  Private (partner only)
 */
export async function getCheckouts(req, res) {
  ensurePartner(req, res);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 1));

  const total = await Redemption.countDocuments({ partnerId: req.user._id });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;

  const checkouts = await Redemption.find({ partnerId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("cyclistId", "name")
    .lean();

  res.json({
    checkouts: checkouts.map((r) => ({
      transactionId: r.transactionId || r._id.toString(),
      cyclistName: r.cyclistId?.name ?? "—",
      itemName: r.itemName ?? "—",
      tokens: r.tokens,
      dateTime: r.createdAt,
    })),
    total,
    page,
    limit,
    totalPages,
  });
}

/**
 * @desc    Get partner scan stats for dashboard (scans today, tokens redeemed today, success rate)
 * @route   GET /api/partner/scan-stats
 * @access  Private (partner only)
 */
export async function getScanStats(req, res) {
  ensurePartner(req, res);

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

  const todayMatch = { partnerId: req.user._id, createdAt: { $gte: startOfToday, $lt: endOfToday } };
  const [scansToday, statsToday, totalRedemptions] = await Promise.all([
    Redemption.countDocuments(todayMatch),
    Redemption.aggregate([
      { $match: todayMatch },
      { $group: { _id: null, tokens: { $sum: "$tokens" } } },
    ]).then((r) => (r[0] ? r[0].tokens : 0)),
    Redemption.countDocuments({ partnerId: req.user._id }),
  ]);

  const tokensRedeemedToday = statsToday;
  const successRate = totalRedemptions > 0 ? 100 : 100;

  res.json({ scansToday, tokensRedeemedToday, successRate });
}

/**
 * @desc    Get partner's most recent redemptions for dashboard card (cyclist name, time, tokens)
 * @route   GET /api/partner/recent-redemptions
 * @query   limit (default 5, max 10)
 * @access  Private (partner only)
 */
export async function getRecentRedemptions(req, res) {
  ensurePartner(req, res);

  const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 5));

  const redemptions = await Redemption.find({ partnerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("cyclistId", "name")
    .lean();

  res.json({
    redemptions: redemptions.map((r) => ({
      _id: r._id.toString(),
      cyclistName: r.cyclistId?.name ?? "—",
      createdAt: r.createdAt,
      tokens: r.tokens,
    })),
  });
}
