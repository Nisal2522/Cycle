/**
 * server.js
 * --------------------------------------------------
 * Entry point for the CycleLink backend API.
 *
 * Middleware pipeline:
 *   1. CORS          — allows frontend origin
 *   2. JSON parser   — parses request bodies
 *   3. Routes        — /api/auth, /api/cyclist, /api/hazards
 *   4. 404 handler   — catches undefined routes
 *   5. Error handler — centralised JSON error responses
 * --------------------------------------------------
 */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import cyclistRoutes from "./routes/cyclistRoutes.js";
import hazardRoutes from "./routes/hazardRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import partnerRoutes from "./routes/partnerRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import asyncHandler from "express-async-handler";
import { protect } from "./middleware/authMiddleware.js";
import { getRides } from "./controllers/cyclistController.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Global middleware ──
app.use(cors({
  origin: "http://localhost:5173", // Vite dev server
  credentials: true,
}));
app.use(express.json({ limit: "10mb" })); // Parse JSON (10mb for image uploads)

// ── Routes (admin first so /api/admin/* is never shadowed) ──
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
// Explicit cyclist/rides so it always registers (avoids 404 if router order varies)
app.get("/api/cyclist/rides", protect, asyncHandler(getRides));
app.use("/api/cyclist", cyclistRoutes);
app.use("/api/hazards", hazardRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/routes", routeRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CycleLink API is running" });
});

// Debug: confirms this server has admin routes (GET /api/admin-check → 200). Remove in production if desired.
app.get("/api/admin-check", (req, res) => {
  res.json({ adminRoutesMounted: true, message: "Restart backend if admin panel still 404s" });
});

// ── Error handling (must be AFTER routes) ──
app.use(notFound);
app.use(errorHandler);

// ── Start server ──
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Cyclist API: GET /api/cyclist/stats, GET /api/cyclist/rides, POST /api/cyclist/update-distance, GET /api/cyclist/leaderboard");
  console.log("Partner API mounted at: GET/PATCH /api/partner/profile, POST /api/partner/upload-image");
});
