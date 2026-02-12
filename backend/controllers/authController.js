/**
 * controllers/authController.js
 * --------------------------------------------------
 * MVC Controller: Authentication logic.
 * Used by routes/authRoutes.js.
 *
 * - registerUser  — POST /api/auth/register
 * - loginUser     — POST /api/auth/login
 * - googleLogin   — POST /api/auth/google (verify Google ID token, find or create user, return JWT)
 * - getProfile    — GET  /api/auth/profile
 * --------------------------------------------------
 */

import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { v2 as cloudinary } from "cloudinary";
import User, { ROLES } from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateRegisterInput(name, email, password, role) {
  if (!name || !name.trim()) return "Full name is required";
  if (name.trim().length < 2 || name.trim().length > 50) return "Name must be between 2 and 50 characters";
  if (!email || !email.trim()) return "Email address is required";
  if (!EMAIL_REGEX.test(email.trim())) return "Please provide a valid email address";
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password must be under 128 characters";
  if (role && !ROLES.includes(role)) return `Invalid role. Must be one of: ${ROLES.join(", ")}`;
  return null;
}

function validateLoginInput(email, password) {
  if (!email || !email.trim()) return "Email address is required";
  if (!EMAIL_REGEX.test(email.trim())) return "Please provide a valid email address";
  if (!password) return "Password is required";
  return null;
}

/**
 * @desc    Register a new user (defaults to "cyclist" role)
 * @access  Public
 */
export async function registerUser(req, res) {
  const { name, email, password, role, shopName } = req.body;

  const validationError = validateRegisterInput(name, email, password, role);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const sanitizedName = name.trim();
  const sanitizedEmail = email.trim().toLowerCase();

  const userExists = await User.findOne({ email: sanitizedEmail });
  if (userExists) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create(
    {
      name: sanitizedName,
      email: sanitizedEmail,
      password,
      role: role || "cyclist",
      ...(role === "partner" && shopName
        ? { shopName: shopName.trim() }
        : {}),
    }
  );

  if (!user) {
    res.status(500);
    throw new Error("Failed to create account. Please try again.");
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName,
    shopImage: user.shopImage || "",
    profileImage: user.profileImage || "",
    partnerTotalRedemptions: user.partnerTotalRedemptions,
    token: generateToken(user._id),
  });
}

/**
 * @desc    Authenticate user & return JWT
 * @access  Public
 */
export async function loginUser(req, res) {
  const { email, password } = req.body;

  const validationError = validateLoginInput(email, password);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: sanitizedEmail });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error("Account is blocked. Contact support.");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName,
    shopImage: user.shopImage || "",
    profileImage: user.profileImage || "",
    partnerTotalRedemptions: user.partnerTotalRedemptions,
    token: generateToken(user._id),
  });
}

/**
 * @desc    Google Sign-In: verify ID token, find or create user, return JWT
 * @body    { credential: string } — Google ID token from frontend
 * @access  Public
 */
export async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!credential || typeof credential !== "string") {
    res.status(400);
    throw new Error("Google credential is required");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !clientId.trim()) {
    res.status(500);
    throw new Error("Google Sign-In is not configured (missing GOOGLE_CLIENT_ID)");
  }

  const client = new OAuth2Client(clientId);
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error("Invalid or expired Google token. Please try again.");
  }

  const email = payload.email && payload.email.trim().toLowerCase();
  const name = (payload.name || payload.given_name || email || "User").trim().slice(0, 50);

  if (!email) {
    res.status(400);
    throw new Error("Google account did not provide an email");
  }

  let user = await User.findOne({ email });

  if (user) {
    if (user.isBlocked) {
      res.status(403);
      throw new Error("Account is blocked. Contact support.");
    }
  } else {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    user = await User.create({
      name: name || "User",
      email,
      password: randomPassword,
      role: "cyclist",
    });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName || null,
    shopImage: user.shopImage || "",
    profileImage: user.profileImage || "",
    partnerTotalRedemptions: user.partnerTotalRedemptions ?? 0,
    token: generateToken(user._id),
  });
}

/**
 * @desc    Public stats for login/landing (e.g. total user count from User collection)
 * @access  Public
 */
export async function getPublicStats(req, res) {
  const totalUsers = await User.countDocuments();
  res.json({ totalUsers });
}

/**
 * @desc    Get current user profile (requires JWT via protect middleware)
 * @access  Private
 */
export async function getProfile(req, res) {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName,
    shopImage: user.shopImage || "",
    profileImage: user.profileImage || "",
    partnerTotalRedemptions: user.partnerTotalRedemptions,
    createdAt: user.createdAt,
  });
}

/**
 * @desc    Update current user profile (name, profileImage)
 * @body    { name?, profileImage? } — profileImage: URL string (set "" to remove)
 * @access  Private
 */
export async function updateProfile(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const { name, profileImage } = req.body;
  if (name !== undefined) user.name = String(name).trim().slice(0, 50);
  if (profileImage !== undefined) user.profileImage = String(profileImage).trim();
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    profileImage: user.profileImage || "",
  });
}

/**
 * @desc    Upload profile/avatar image (Cloudinary), update user.profileImage
 * @body    { image: "data:image/...;base64,..." }
 * @access  Private
 */
export async function uploadAvatar(req, res) {
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
    throw new Error("Image upload is not configured.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  const result = await cloudinary.uploader.upload(image, {
    folder: "cyclelink/avatars",
    resource_type: "image",
  });
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.profileImage = result.secure_url;
  await user.save();
  res.json({ url: result.secure_url, profileImage: result.secure_url });
}
