/**
 * tests/unit/authService.test.js — Unit tests for auth service (Requirement vii).
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock dependencies before importing service
jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
  },
}));
jest.unstable_mockModule("../../src/utils/generateToken.js", () => ({ default: () => "mock-jwt-token" }));

const { register, login, getPublicStats } = await import("../../src/services/authService.js");
const User = (await import("../../src/models/User.js")).default;

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("throws if email already exists", async () => {
      User.findOne.mockResolvedValue({ _id: "existing" });
      await expect(register({ name: "Test", email: "test@test.com", password: "password123" })).rejects.toThrow(
        "An account with this email already exists"
      );
      expect(User.create).not.toHaveBeenCalled();
    });

    it("calls User.create with sanitized input when email is new", async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: "new-id",
        name: "Test",
        email: "test@test.com",
        role: "cyclist",
        shopName: "",
        shopImage: "",
        profileImage: "",
        partnerTotalRedemptions: 0,
      });
      const result = await register({ name: "  Test  ", email: "  Test@Test.COM  ", password: "password123" });
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test",
          email: "test@test.com",
          password: "password123",
          role: "cyclist",
        })
      );
      expect(result.token).toBe("mock-jwt-token");
    });
  });

  describe("login", () => {
    it("throws on invalid credentials", async () => {
      User.findOne.mockResolvedValue(null);
      await expect(login("nobody@test.com", "wrong")).rejects.toThrow("Invalid email or password");
    });

    it("throws when user is blocked", async () => {
      User.findOne.mockResolvedValue({
        matchPassword: jest.fn().mockResolvedValue(true),
        isBlocked: true,
      });
      await expect(login("blocked@test.com", "pass")).rejects.toThrow("Account is blocked");
    });
  });

  describe("getPublicStats", () => {
    it("returns totalUsers from countDocuments", async () => {
      User.countDocuments.mockResolvedValue(42);
      const result = await getPublicStats();
      expect(result).toEqual({ totalUsers: 42 });
    });
  });
});
