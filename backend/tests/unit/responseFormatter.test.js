/**
 * tests/unit/responseFormatter.test.js — Unit tests for responseFormatter (Requirement vii).
 */
import { describe, it, expect, jest } from "@jest/globals";
import { success, paginated, error } from "../../src/utils/responseFormatter.js";

describe("responseFormatter", () => {
  describe("success", () => {
    it("sends 200 with success true and data", () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      success(res, { id: 1 }, "OK");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "OK", data: { id: 1 } });
    });
    it("sends 201 when statusCode given", () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      success(res, null, "Created", 201);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("paginated", () => {
    it("sends 200 with data and pagination", () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      paginated(res, [{ a: 1 }], 100, 1, 10);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [{ a: 1 }],
          pagination: { total: 100, page: 1, limit: 10, totalPages: 10 },
        })
      );
    });
  });

  describe("error", () => {
    it("sends statusCode and message", () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      error(res, "Bad request", 400);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Bad request" });
    });
  });
});
