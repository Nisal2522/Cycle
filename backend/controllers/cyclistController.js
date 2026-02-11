/**
 * controllers/cyclistController.js
 * --------------------------------------------------
 * MVC Controller: Cyclist dashboard & stats logic.
 * Used by routes/cyclistRoutes.js.
 *
 * - getStats         — GET  /api/cyclist/stats
 * - updateDistance   — POST /api/cyclist/update-distance
 * - getLeaderboard   — GET  /api/cyclist/leaderboard
 * --------------------------------------------------
 */

import User from "../models/User.js";
import Reward from "../models/Reward.js";
import Ride from "../models/Ride.js";

const CO2_PER_KM = 0.21;
const TOKENS_PER_KM = 10;

/**
 * @desc    Get authenticated cyclist's dashboard stats
 * @access  Private
 */
export async function getStats(req, res) {
  const user = await User.findById(req.user._id).select(
    "name email tokens totalDistance co2Saved totalRides safetyScore"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    tokens: user.tokens,
    totalDistance: parseFloat(user.totalDistance.toFixed(2)),
    co2Saved: parseFloat(user.co2Saved.toFixed(2)),
    totalRides: user.totalRides,
    safetyScore: user.safetyScore,
  });
}

/**
 * @desc    Add distance from a ride; auto-calc CO₂ and tokens; store Ride for history
 * @body    { distance: number (km), startLocation?, endLocation?, duration? (e.g. "18 min") }
 * @access  Private
 */
export async function updateDistance(req, res) {
  const { distance, startLocation, endLocation, duration } = req.body;

  if (!distance || typeof distance !== "number" || distance <= 0) {
    res.status(400);
    throw new Error("Distance must be a positive number (in km)");
  }

  if (distance > 500) {
    res.status(400);
    throw new Error("Distance seems too large. Maximum 500 km per update.");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const tokensEarned = Math.round(distance * TOKENS_PER_KM);
  const co2Earned = parseFloat((distance * CO2_PER_KM).toFixed(2));

  user.totalDistance += distance;
  user.co2Saved += co2Earned;
  user.tokens += tokensEarned;
  user.totalRides += 1;
  await user.save();

  await Ride.create({
    cyclistId: req.user._id,
    startLocation: startLocation != null ? String(startLocation).trim() || "—" : "—",
    endLocation: endLocation != null ? String(endLocation).trim() || "—" : "—",
    distance: parseFloat(distance.toFixed(2)),
    durationText: duration != null ? String(duration).trim() : "",
    tokensEarned,
    co2Saved: co2Earned,
  });

  res.json({
    message: "Ride recorded successfully!",
    tokensEarned,
    co2Earned,
    distance: parseFloat(distance.toFixed(2)),
    totals: {
      tokens: user.tokens,
      totalDistance: parseFloat(user.totalDistance.toFixed(2)),
      co2Saved: parseFloat(user.co2Saved.toFixed(2)),
      totalRides: user.totalRides,
    },
  });
}

/**
 * @desc    Get cyclist's ride history with optional period and search
 * @query   period = week | month | 3months | all (default: week)
 *          search = optional string to filter by start/end location
 * @res     { summary: { totalDistance, totalRides, totalTokens, totalCo2 }, rides: [...] }
 * @access  Private
 */
export async function getRides(req, res) {
  const period = (req.query.period || "week").toLowerCase();
  const search = (req.query.search || "").trim().toLowerCase();

  const now = new Date();
  let startDate = null;
  if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "3months") {
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 3);
  }
  // "all" => startDate stays null

  const match = { cyclistId: req.user._id };
  if (startDate) match.createdAt = { $gte: startDate };

  let rides = await Ride.find(match).sort({ createdAt: -1 }).limit(100).lean();

  if (search) {
    rides = rides.filter(
      (r) =>
        (r.startLocation && r.startLocation.toLowerCase().includes(search)) ||
        (r.endLocation && r.endLocation.toLowerCase().includes(search))
    );
  }

  const summary = rides.reduce(
    (acc, r) => {
      acc.totalDistance += r.distance;
      acc.totalRides += 1;
      acc.totalTokens += r.tokensEarned;
      acc.totalCo2 += r.co2Saved;
      return acc;
    },
    { totalDistance: 0, totalRides: 0, totalTokens: 0, totalCo2: 0 }
  );

  res.json({
    summary: {
      totalDistance: parseFloat(summary.totalDistance.toFixed(2)),
      totalRides: summary.totalRides,
      totalTokens: summary.totalTokens,
      totalCo2: parseFloat(summary.totalCo2.toFixed(2)),
    },
    rides: rides.map((r) => ({
      _id: r._id,
      startLocation: r.startLocation || "—",
      endLocation: r.endLocation || "—",
      distance: r.distance,
      durationText: r.durationText || null,
      durationMinutes: r.durationMinutes,
      tokensEarned: r.tokensEarned,
      co2Saved: r.co2Saved,
      createdAt: r.createdAt,
    })),
  });
}

/**
 * @desc    Get top 5 cyclists by totalDistance
 * @access  Private
 */
export async function getLeaderboard(req, res) {
  const leaders = await User.find({ role: "cyclist" })
    .sort({ totalDistance: -1 })
    .limit(5)
    .select("name totalDistance co2Saved tokens totalRides");

  res.json(
    leaders.map((u, idx) => ({
      rank: idx + 1,
      _id: u._id,
      name: u.name,
      totalDistance: parseFloat(u.totalDistance.toFixed(2)),
      co2Saved: parseFloat(u.co2Saved.toFixed(2)),
      tokens: u.tokens,
      totalRides: u.totalRides,
    }))
  );
}

/**
 * @desc    Get total number of active partner shops
 * @access  Public
 */
export async function getPartnerCount(req, res) {
  const count = await User.countDocuments({ role: "partner" });
  res.json({ count });
}

/**
 * @desc    Get all partner shops with basic info + reward preview
 * @route   GET /api/cyclist/partners
 * @access  Public
 */
export async function getPartnerShops(req, res) {
  const partners = await User.find({ role: "partner" })
    .select("shopName shopImage location address category")
    .lean();

  // Attach first 2 active rewards per partner for preview badges
  const partnerIds = partners.map((p) => p._id);
  const rewards = await Reward.find({
    partnerId: { $in: partnerIds },
    active: true,
  })
    .select("partnerId title tokenCost")
    .sort({ createdAt: -1 })
    .lean();

  // Group rewards by partner
  const rewardMap = {};
  for (const r of rewards) {
    const pid = r.partnerId.toString();
    if (!rewardMap[pid]) rewardMap[pid] = [];
    rewardMap[pid].push(r);
  }

  const result = partners.map((p) => ({
    ...p,
    rewardPreview: (rewardMap[p._id.toString()] || []).slice(0, 2),
    totalRewards: (rewardMap[p._id.toString()] || []).length,
  }));

  res.json(result);
}

/**
 * @desc    Get all active rewards for a specific partner shop
 * @route   GET /api/cyclist/partners/:id/rewards
 * @access  Public
 */
export async function getShopRewards(req, res) {
  const { id } = req.params;

  const partner = await User.findById(id)
    .select("shopName shopImage location category")
    .lean();

  if (!partner) {
    res.status(404);
    throw new Error("Partner shop not found");
  }

  const rewards = await Reward.find({ partnerId: id, active: true })
    .select("title description tokenCost expiryDate")
    .sort({ tokenCost: 1 })
    .lean();

  res.json({ partner, rewards });
}
