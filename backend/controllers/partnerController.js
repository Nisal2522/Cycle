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

function ensurePartner(req, res) {
  if (!req.user || req.user.role !== "partner") {
    res.status(403);
    throw new Error("Only partners can perform this action");
  }
}

const PARTNER_SELECT =
  "name email role shopName shopImage description location address category phoneNumber partnerTotalRedemptions";

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
