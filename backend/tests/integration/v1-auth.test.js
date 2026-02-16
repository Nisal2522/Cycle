/**
 * tests/integration/v1-auth.test.js — Endpoint tests for /api/v1/auth (Requirement vii).
 * Tests that do not require MongoDB (no /auth/stats to avoid open handles).
 */
import request from "supertest";
import express from "express";
import v1Routes from "../../src/routes/v1/index.js";
import { notFound, errorHandler } from "../../src/middleware/errorHandler.js";

const app = express();
app.use(express.json());
app.use("/api/v1", v1Routes);
app.use(notFound);
app.use(errorHandler);

describe("POST /api/v1/auth/login", () => {
  it("returns 400 when body is invalid", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(400);
  });
}, 10000);

describe("GET /api/v1/auth/profile", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/auth/profile");
    expect(res.status).toBe(401);
  });
});
