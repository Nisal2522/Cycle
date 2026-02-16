/**
 * src/middleware/role.js — Role-Based Access Control: Partner vs Cyclist (Requirement iv & v).
 */
import asyncHandler from "express-async-handler";

export const partnerOnly = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "partner") {
    res.status(403);
    throw new Error("Only partners can perform this action");
  }
  next();
});

export const cyclistOnly = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "cyclist") {
    res.status(403);
    throw new Error("Only cyclists can perform this action");
  }
  next();
});

export const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403);
    throw new Error("Access denied — admin only");
  }
  next();
});
