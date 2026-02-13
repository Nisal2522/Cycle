/**
 * server.js
 * --------------------------------------------------
 * Entry point for the CycleLink backend API.
 * HTTP server + Express + Socket.io for real-time chat.
 * --------------------------------------------------
 */

import http from "http";
import express from "express";
import { Server } from "socket.io";
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
import paymentRoutes from "./routes/paymentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { stripeWebhook } from "./controllers/paymentController.js";
import asyncHandler from "express-async-handler";
import { protect } from "./middleware/authMiddleware.js";
import { getRides } from "./controllers/cyclistController.js";
import { setupChatSocket } from "./socket/chatSocket.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB (uses process.env.MONGO_URI)
connectDB();

const app = express();

// ── CORS: allow frontend origin(s). Set FRONTEND_ORIGIN in production (e.g. https://cycle-rose-tau.vercel.app).
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean) : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
// Stripe webhook needs raw body for signature verification (must be before express.json)
app.use("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);
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
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);

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

// ── HTTP server (for Socket.io attachment). Use process.env.PORT for deployment (Render, Heroku, etc.). ──
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
  path: "/socket.io",
});
app.set("io", io);
setupChatSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Chat socket: connect with auth.token (JWT)");
});
