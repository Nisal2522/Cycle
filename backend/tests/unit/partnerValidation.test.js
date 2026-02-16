/**
 * tests/unit/partnerValidation.test.js — Unit tests for partner validation (Requirement 1).
 * Bank details schema: all fields required (Requirement v).
 */
import { describe, it, expect } from "@jest/globals";
import { bankDetailsSchema } from "../../src/validatons/partnerValidation.js";

describe("partnerValidation", () => {
  describe("bankDetailsSchema", () => {
    it("accepts valid bank details", () => {
      const valid = {
        bankName: "Commercial Bank",
        branchName: "Colombo Main",
        accountNo: "1234567890",
        accountHolderName: "John Doe",
      };
      const { error, value } = bankDetailsSchema.validate(valid);
      expect(error).toBeUndefined();
      expect(value.bankName).toBe("Commercial Bank");
      expect(value.accountNo).toBe("1234567890");
    });

    it("rejects missing bankName", () => {
      const input = {
        branchName: "Colombo",
        accountNo: "123",
        accountHolderName: "Jane",
      };
      const { error } = bankDetailsSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes("bankName"))).toBe(true);
    });

    it("rejects empty bankName", () => {
      const input = {
        bankName: "   ",
        branchName: "Colombo",
        accountNo: "123",
        accountHolderName: "Jane",
      };
      const { error } = bankDetailsSchema.validate(input);
      expect(error).toBeDefined();
    });

    it("rejects when accountHolderName is missing", () => {
      const input = {
        bankName: "Bank",
        branchName: "Branch",
        accountNo: "123",
      };
      const { error } = bankDetailsSchema.validate(input);
      expect(error).toBeDefined();
    });
  });
});
