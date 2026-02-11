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
 * @desc    Get user growth/trip data for chart (last 12 months)
 * @route   GET /api/admin/chart-data
 */
export async function getChartData(req, res) {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const userCounts = await Promise.all(
    months.map((m) => {
      const start = new Date(`${m}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      return User.countDocuments({ createdAt: { $gte: start, $lt: end } });
    })
  );

  const routeCounts = await Promise.all(
    months.map((m) => {
      const start = new Date(`${m}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      return Route.countDocuments({ createdAt: { $gte: start, $lt: end } });
    })
  );

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const labels = months.map((m) => {
    const [y, mo] = m.split("-");
    return `${monthNames[parseInt(mo, 10) - 1]} ${y}`;
  });

  res.json({
    labels,
    months,
    users: userCounts,
    routes: routeCounts,
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
