/**
 * controllers/adminController.js
 * --------------------------------------------------
 * Super Admin: stats, user/partner management, route moderation, payouts.
 * All routes protected by protect + adminOnly. JWT required.
 */

import User from "../models/User.js";
import Route from "../models/Route.js";
import Hazard from "../models/Hazard.js";
import Redemption from "../models/Redemption.js";
import Payout, { TOKEN_VALUE } from "../models/Payout.js";
import PayoutRequest from "../models/PayoutRequest.js";
import Payment from "../models/Payment.js";

/**
 * @desc    Get dashboard stats: total users, partners, routes, hazards
 * @route   GET /api/admin/stats
 */
export async function getStats(req, res) {
  const [totalUsers, totalPartners, totalRoutes, totalHazards] = await Promise.all([
    User.countDocuments({ role: "cyclist" }),
    User.countDocuments({ role: "partner" }),
    Route.countDocuments(),
    Hazard.countDocuments(),
  ]);

  res.json({
    totalUsers: totalUsers + totalPartners + (await User.countDocuments({ role: "admin" })),
    totalCyclists: totalUsers,
    totalPartners,
    totalRoutes,
    totalHazards,
  });
}

/**
 * @desc    Get all users and partners for management table
 * @route   GET /api/admin/users
 */
export async function getUsers(req, res) {
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  const list = users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    shopName: u.shopName || null,
    isVerified: u.isVerified ?? false,
    isBlocked: u.isBlocked ?? false,
    status: u.isBlocked ? "Blocked" : (u.role === "partner" && !u.isVerified ? "Pending" : "Active"),
    partnerTotalRedemptions: u.partnerTotalRedemptions ?? 0,
    createdAt: u.createdAt,
  }));

  res.json(list);
}

/**
 * @desc    Verify a user (set isVerified = true)
 * @route   PATCH /api/admin/users/:id/verify
 */
export async function verifyUser(req, res) {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.isVerified = true;
  await user.save();
  res.json({ _id: user._id, isVerified: true, message: "User verified" });
}

/**
 * @desc    Block or unblock a user
 * @route   PATCH /api/admin/users/:id/block
 * @body    { block: boolean }
 */
export async function blockUser(req, res) {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(403);
    throw new Error("Cannot block an admin");
  }
  user.isBlocked = req.body.block !== false;
  await user.save();
  res.json({ _id: user._id, isBlocked: user.isBlocked, message: user.isBlocked ? "User blocked" : "User unblocked" });
}

/**
 * @desc    Delete a user (non-admin only)
 * @route   DELETE /api/admin/users/:id
 */
export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(403);
    throw new Error("Cannot delete an admin");
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
}

/**
 * @desc    Get all community routes for moderation
 * @route   GET /api/admin/routes
 */
export async function getRoutes(req, res) {
  const userCollection = User.collection.name;
  const routes = await Route.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: 500 },
    // Ensure creatorId is ObjectId for $lookup (handles string vs ObjectId in DB)
    {
      $addFields: {
        _creatorIdLookup: {
          $cond: {
            if: { $eq: [{ $type: "$creatorId" }, "objectId"] },
            then: "$creatorId",
            else: { $convert: { input: "$creatorId", to: "objectId", onError: null, onNull: null } },
          },
        },
      },
    },
    {
      $lookup: {
        from: userCollection,
        localField: "_creatorIdLookup",
        foreignField: "_id",
        as: "creatorDoc",
      },
    },
    {
      $addFields: {
        _firstCreator: { $arrayElemAt: ["$creatorDoc", 0] },
      },
    },
    {
      $addFields: {
        creatorId: {
          $cond: {
            if: { $gt: [{ $size: "$creatorDoc" }, 0] },
            then: {
              _id: "$_firstCreator._id",
              name: "$_firstCreator.name",
              email: "$_firstCreator.email",
            },
            else: { _id: "$_creatorIdLookup" },
          },
        },
      },
    },
    { $project: { creatorDoc: 0, _firstCreator: 0, _creatorIdLookup: 0 } },
  ]);

  res.json(routes);
}

/**
 * @desc    Delete any route (moderation)
 * @route   DELETE /api/admin/routes/:id
 */
export async function deleteRoute(req, res) {
  const route = await Route.findByIdAndDelete(req.params.id);
  if (!route) {
    res.status(404);
    throw new Error("Route not found");
  }
  res.json({ message: "Route deleted" });
}

/**
 * @desc    Get all hazard reports for admin map (coordinates, type, description, reportedBy)
 * @route   GET /api/admin/hazards
 * @access  Admin only
 * @res     Array of { _id, lat, lng, type, description, reportedBy: { name, email }, createdAt }
 */
export async function getAdminHazards(req, res) {
  const raw = await Hazard.find({ active: true })
    .select("lat lng type description reportedBy createdAt")
    .populate("reportedBy", "name email")
    .sort({ createdAt: -1 })
    .lean()
    .limit(500);
  const hazards = raw.map((h) => {
    const rb = h.reportedBy;
    const reportedBy =
      rb && typeof rb === "object"
        ? { _id: rb._id, name: rb.name ?? null, email: rb.email ?? null }
        : null;
    return {
      _id: h._id,
      lat: h.lat,
      lng: h.lng,
      type: h.type ?? "other",
      description: h.description != null ? String(h.description) : "",
      reportedBy,
      createdAt: h.createdAt,
    };
  });
  res.json(hazards);
}

/**
 * @desc    Mark hazard as resolved (set active: false). Removes from map; keeps in DB.
 * @route   PATCH /api/admin/hazards/:id/resolve
 * @access  Admin only
 */
export async function resolveAdminHazard(req, res) {
  const hazard = await Hazard.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true, runValidators: true }
  );
  if (!hazard) {
    return res.status(404).json({ message: "Hazard not found", _id: req.params.id });
  }
  return res.json({ _id: hazard._id, active: false, message: "Hazard marked as resolved" });
}

/**
 * @desc    Delete any hazard (admin moderation)
 * @route   DELETE /api/admin/hazards/:id
 * @access  Admin only
 */
export async function deleteAdminHazard(req, res) {
  const hazard = await Hazard.findByIdAndDelete(req.params.id);
  if (!hazard) {
    return res.status(404).json({ message: "Hazard not found", _id: req.params.id });
  }
  return res.json({ message: "Hazard deleted", _id: req.params.id });
}

/** Haversine distance in meters between two points */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Path length in meters (sum of segment lengths) */
function pathLengthMeters(path) {
  if (!Array.isArray(path) || path.length < 2) return 0;
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    len += haversineMeters(
      path[i - 1].lat,
      path[i - 1].lng,
      path[i].lat,
      path[i].lng
    );
  }
  return len;
}

/** Min distance (meters) from point to any segment of the path */
function pointToPathDistanceMeters(lat, lng, path) {
  if (!Array.isArray(path) || path.length === 0) return Infinity;
  if (path.length === 1) return haversineMeters(lat, lng, path[0].lat, path[0].lng);
  let min = Infinity;
  for (let i = 1; i < path.length; i++) {
    const d = pointToSegmentMeters(lat, lng, path[i - 1], path[i]);
    if (d < min) min = d;
  }
  return min;
}

/** Distance from point to line segment (meters); linear interpolation in lat/lng then haversine */
function pointToSegmentMeters(plat, plng, a, b) {
  const dlat = b.lat - a.lat;
  const dlng = b.lng - a.lng;
  const denom = dlat * dlat + dlng * dlng + 1e-20;
  let t = ((plat - a.lat) * dlat + (plng - a.lng) * dlng) / denom;
  t = Math.max(0, Math.min(1, t));
  const closestLat = a.lat + t * dlat;
  const closestLng = a.lng + t * dlng;
  return haversineMeters(plat, plng, closestLat, closestLng);
}

/**
 * @desc    Get auto-detected issues for all approved routes (for Admin Map).
 *          Returns { [routeId]: { inaccuratePath, safetyIssue, duplicate, junk, hazardCount, duplicateGroup, detectedIssue, suggestion } }
 * @route   GET /api/admin/route-issues
 * @access  Admin only
 */
export async function getRouteIssues(req, res) {
  const routes = await Route.find({
    $or: [{ status: "approved" }, { status: { $exists: false } }],
  })
    .lean()
    .limit(500);

  const hazards = await Hazard.find({ active: true }).select("lat lng").lean();

  const JUNK_NAMES = /test|asdf/i;
  const HAZARD_NEAR_METERS = 50;
  const JUNK_LENGTH_METERS = 200;
  const DUPLICATE_DISTANCE_TOLERANCE = 0.15;

  const issuesByRoute = {};

  for (const r of routes) {
    const path = Array.isArray(r.path) ? r.path : [];
    const lenM = pathLengthMeters(path);
    const startEnd = [r.startLocation, r.endLocation].filter(Boolean).join(" ").toLowerCase();
    const junk =
      lenM < JUNK_LENGTH_METERS || JUNK_NAMES.test(r.startLocation || "") || JUNK_NAMES.test(r.endLocation || "");

    let hazardCount = 0;
    for (const h of hazards) {
      if (pointToPathDistanceMeters(h.lat, h.lng, path) <= HAZARD_NEAR_METERS) hazardCount++;
    }
    const safetyIssue = hazardCount > 3;

    const distNum = parseFloat(String(r.distance || "0").replace(/[^\d.]/g, "")) || 0;
    const key = [r.startLocation, r.endLocation].map((s) => (s || "").toLowerCase().trim()).join("|");
    issuesByRoute[r._id.toString()] = {
      inaccuratePath: false,
      safetyIssue,
      duplicate: false,
      junk,
      hazardCount,
      duplicateGroup: [],
      detectedIssue: null,
      suggestion: null,
      pathLengthMeters: lenM,
      _key: key,
      _distNum: distNum,
    };
  }

  const keyToRoutes = {};
  for (const id of Object.keys(issuesByRoute)) {
    const o = issuesByRoute[id];
    const k = o._key;
    if (!keyToRoutes[k]) keyToRoutes[k] = [];
    keyToRoutes[k].push({ id, distNum: o._distNum });
  }
  for (const group of Object.values(keyToRoutes)) {
    if (group.length < 2) continue;
    for (const a of group) {
      const siblings = group.filter(
        (b) => b.id !== a.id && Math.abs(a.distNum - b.distNum) <= Math.max(a.distNum, b.distNum, 0.1) * DUPLICATE_DISTANCE_TOLERANCE
      );
      if (siblings.length > 0) {
        issuesByRoute[a.id].duplicate = true;
        issuesByRoute[a.id].duplicateGroup = [a.id, ...siblings.map((s) => s.id)];
      }
    }
  }

  for (const id of Object.keys(issuesByRoute)) {
    const o = issuesByRoute[id];
    delete o._key;
    delete o._distNum;
    delete o.pathLengthMeters;

    const types = [];
    if (o.inaccuratePath) types.push("Inaccurate Path");
    if (o.safetyIssue) types.push("Safety Issues");
    if (o.duplicate) types.push("Potential Duplicate");
    if (o.junk) types.push("Junk Data");

    o.detectedIssue = types.length ? types.join("; ") : null;
    if (o.inaccuratePath) o.suggestion = "Snap route to roads or correct the path.";
    else if (o.safetyIssue) o.suggestion = "Review hazards on this route; consider warning cyclists.";
    else if (o.duplicate) o.suggestion = "Review and delete one of the duplicate routes.";
    else if (o.junk) o.suggestion = "Consider deleting this test or invalid route.";
    else o.suggestion = null;
  }

  res.json(issuesByRoute);
}

/**
 * @desc    Get all approved routes with path for admin Live Route Overview map.
 *          Returns full path (coordinates), start/end, distance, duration, creator name.
 * @route   GET /api/admin/approved-routes
 * @access  Admin only (protect + adminOnly)
 */
export async function getApprovedRoutes(req, res) {
  const routes = await Route.find({
    $or: [{ status: "approved" }, { status: { $exists: false } }],
  })
    .populate("creatorId", "name email")
    .sort({ createdAt: -1 })
    .lean()
    .limit(500);
  res.json(routes);
}

/**
 * @desc    Get all routes with status 'pending' (for approval table and route preview).
 *          Response includes path (coordinates), distance, duration, creatorId for admin-only preview.
 * @route   GET /api/admin/pending-routes
 * @access  Admin only (protect + adminOnly)
 */
export async function getPendingRoutes(req, res) {
  const routes = await Route.find({ status: "pending" })
    .populate("creatorId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  res.json(routes);
}

/**
 * @desc    Approve a route (set status to 'approved'). Route becomes visible on main map.
 * @route   PATCH /api/admin/approve-route/:id
 */
export async function approveRoute(req, res) {
  const route = await Route.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true, runValidators: true }
  );
  if (!route) {
    res.status(404);
    throw new Error("Route not found");
  }
  res.json({ _id: route._id, status: "approved", message: "Route approved" });
}

/**
 * @desc    Reject a route (set status to 'rejected')
 * @route   PATCH /api/admin/reject-route/:id
 */
export async function rejectRoute(req, res) {
  const route = await Route.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true, runValidators: true }
  );
  if (!route) {
    res.status(404);
    throw new Error("Route not found");
  }
  res.json({ _id: route._id, status: "rejected", message: "Route rejected" });
}

/**
 * @desc    Get Stripe payments (live transactions) for admin table
 * @route   GET /api/admin/payments
 * @access  Admin only
 */
export async function getPayments(req, res) {
  const payments = await Payment.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  res.json(payments);
}

/**
 * @desc    Get payouts (all or by partner)
 * @route   GET /api/admin/payouts
 */
export async function getPayouts(req, res) {
  const payouts = await Payout.find()
    .populate("partnerId", "name email shopName")
    .sort({ month: -1, createdAt: -1 })
    .lean();
  res.json(payouts);
}

/**
 * @desc    Calculate payouts for a given month (aggregate redemptions → Payout docs)
 * @route   POST /api/admin/payouts/calculate
 * @body    { month: "YYYY-MM" }
 */
export async function calculatePayouts(req, res) {
  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    res.status(400);
    throw new Error("month required as YYYY-MM");
  }

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const aggregated = await Redemption.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: "$partnerId", totalTokens: { $sum: "$tokens" } } },
  ]);

  const results = [];
  for (const row of aggregated) {
    if (row.totalTokens < 1) continue;
    const totalAmount = row.totalTokens * TOKEN_VALUE;
    const existing = await Payout.findOne({ partnerId: row._id, month });
    if (existing) {
      results.push({ partnerId: row._id, month, totalTokens: row.totalTokens, totalAmount, status: "already exists" });
      continue;
    }
    const payout = await Payout.create({
      partnerId: row._id,
      month,
      totalTokens: row.totalTokens,
      totalAmount,
      status: "Pending",
    });
    results.push(await Payout.findById(payout._id).populate("partnerId", "name shopName").lean());
  }

  res.json({ message: "Payouts calculated", count: results.length, payouts: results });
}

/**
 * @desc    Process a single payout (mark as paid, optional Stripe integration)
 * @route   POST /api/admin/payouts/:id/process
 */
export async function processPayout(req, res) {
  const payout = await Payout.findById(req.params.id).populate("partnerId", "name email shopName");
  if (!payout) {
    res.status(404);
    throw new Error("Payout not found");
  }
  if (payout.status === "Paid") {
    res.status(400);
    throw new Error("Payout already processed");
  }

  let transactionId = `cycle_${payout._id}_${Date.now()}`;

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
      const amountCents = Math.round(payout.totalAmount * 100);
      const transfer = await stripeClient.transfers.create({
        amount: amountCents,
        currency: "lkr",
        description: `CycleLink payout ${payout.month} - ${payout.partnerId?.shopName || payout.partnerId?.name}`,
      });
      transactionId = transfer.id || transactionId;
    } catch (err) {
      console.error("Stripe transfer failed:", err);
      res.status(502);
      throw new Error(err.message || "Payment gateway error");
    }
  }
  // If no Stripe: transactionId remains the cycle_ id (manual payout recorded)

  payout.status = "Paid";
  payout.transactionId = transactionId;
  await payout.save();

  res.json({
    _id: payout._id,
    status: "Paid",
    transactionId,
    message: "Payout processed successfully",
  });
}

/**
 * @desc    Get all partner payout requests
 * @route   GET /api/admin/payout-requests
 */
export async function getPayoutRequests(req, res) {
  const requests = await PayoutRequest.find()
    .populate("partnerId", "name email shopName")
    .sort({ createdAt: -1 })
    .lean();
  res.json(requests);
}

/**
 * @desc    Approve and pay a single payout request (Stripe transfer + mark Paid)
 * @route   POST /api/admin/payout-requests/:id/approve
 */
export async function approvePayoutRequest(req, res) {
  const request = await PayoutRequest.findById(req.params.id).populate("partnerId", "name email shopName partnerAvailableBalance");
  if (!request) {
    res.status(404);
    throw new Error("Payout request not found");
  }
  if (request.status === "Paid") {
    res.status(400);
    throw new Error("Payout request already paid");
  }

  const partner = await User.findById(request.partnerId._id).select("partnerAvailableBalance shopName name");
  if (!partner) {
    res.status(404);
    throw new Error("Partner not found");
  }
  if (partner.partnerAvailableBalance < request.amount) {
    res.status(400);
    throw new Error("Partner available balance is insufficient for this payout");
  }

  let transactionId = `payoutreq_${request._id}_${Date.now()}`;

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
      const amountCents = Math.round(request.amount * 100);
      const transfer = await stripeClient.transfers.create({
        amount: amountCents,
        currency: "lkr",
        description: `Partner payout request - ${partner.shopName || partner.name}`,
        metadata: {
          payoutRequestId: String(request._id),
          partnerId: String(partner._id),
        },
      });
      transactionId = transfer.id || transactionId;
    } catch (err) {
      console.error("Stripe transfer (payout request) failed:", err);
      res.status(502);
      throw new Error(err.message || "Payment gateway error");
    }
  }

  // Mark as paid and deduct partner available balance
  request.status = "Paid";
  request.transactionId = transactionId;
  await request.save();

  partner.partnerAvailableBalance = Math.max(0, (partner.partnerAvailableBalance || 0) - request.amount);
  await partner.save();

  res.json({
    _id: request._id,
    status: "Paid",
    transactionId,
    message: "Payout request processed successfully",
  });
}

/**
 * @desc    User growth stats aggregated by period (month or day) and role
 * @route   GET /api/admin/user-growth-stats?period=thisYear|thisMonth
 * @query   period — "thisYear" (default) or "thisMonth"
 * @res     { labels, userData, partnerData }
 */
export async function getUserGrowthStats(req, res) {
  const period = (req.query.period || "thisYear").toLowerCase();
  const now = new Date();
  let start;
  let labels = [];
  let periodFormat;
  let periodKeys = [];

  if (period === "thismonth") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      periodKeys.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      labels.push(`Day ${d}`);
    }
    periodFormat = "%Y-%m-%d";
  } else {
    start = new Date(now.getFullYear(), 0, 1);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let m = 1; m <= 12; m++) {
      periodKeys.push(`${now.getFullYear()}-${String(m).padStart(2, "0")}`);
      labels.push(monthNames[m - 1]);
    }
    periodFormat = "%Y-%m";
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const agg = await User.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, role: { $in: ["cyclist", "partner"] } } },
    {
      $group: {
        _id: {
          period:
            periodFormat === "%Y-%m-%d"
              ? { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
              : { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          role: "$role",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const countByPeriodAndRole = {};
  agg.forEach((row) => {
    const key = row._id.period;
    if (!countByPeriodAndRole[key]) countByPeriodAndRole[key] = { cyclist: 0, partner: 0 };
    if (row._id.role === "cyclist") countByPeriodAndRole[key].cyclist = row.count;
    if (row._id.role === "partner") countByPeriodAndRole[key].partner = row.count;
  });

  const userData = periodKeys.map((key) => countByPeriodAndRole[key]?.cyclist ?? 0);
  const partnerData = periodKeys.map((key) => countByPeriodAndRole[key]?.partner ?? 0);

  res.json({ labels, userData, partnerData });
}
