import { describe, expect, it } from "vitest";

import { enquirySchema } from "@/lib/enquiry-schema";

/**
 * The enquiry contract.
 *
 * This schema is the only validation the server does, so its edge cases matter:
 * a rule that is too strict silently loses a real enquiry, which for a small
 * music school is a lost student.
 */

const valid = {
  name: "Rachana Agarwal",
  email: "rachana@example.com",
  phone: "",
  interest: "" as const,
  mode: "" as const,
  message: "I would like to enrol my daughter, who is eight.",
  botField: "" as const,
};

describe("enquirySchema", () => {
  it("accepts a minimal enquiry with only name, email and message", () => {
    expect(enquirySchema.safeParse(valid).success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const parsed = enquirySchema.parse({ ...valid, name: "  Neha Sahai  " });
    expect(parsed.name).toBe("Neha Sahai");
  });

  it("rejects a missing or malformed email", () => {
    expect(enquirySchema.safeParse({ ...valid, email: "" }).success).toBe(
      false,
    );
    expect(
      enquirySchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects a message too short to act on", () => {
    expect(enquirySchema.safeParse({ ...valid, message: "hi" }).success).toBe(
      false,
    );
  });

  describe("phone numbers", () => {
    // Real enquirers write numbers in all of these ways; all must be accepted.
    it.each([
      "",
      "81895399",
      "8189 5399",
      "+65 8189 5399",
      "+6581895399",
      "(65) 8189-5399",
      "+91 98200 12345",
      "+44 20 7946 0958",
    ])("accepts %j", (phone) => {
      expect(enquirySchema.safeParse({ ...valid, phone }).success).toBe(true);
    });

    it.each(["abc", "call me", "12"])("rejects %j", (phone) => {
      expect(enquirySchema.safeParse({ ...valid, phone }).success).toBe(false);
    });
  });

  it("rejects an interest or mode that is not one of the offered options", () => {
    expect(
      enquirySchema.safeParse({ ...valid, interest: "Tabla lessons" }).success,
    ).toBe(false);
    expect(enquirySchema.safeParse({ ...valid, mode: "By post" }).success).toBe(
      false,
    );
  });

  it("rejects a filled honeypot, so the action can never miss a bot", () => {
    expect(
      enquirySchema.safeParse({ ...valid, botField: "spam" }).success,
    ).toBe(false);
  });

  it("caps absurd lengths", () => {
    expect(
      enquirySchema.safeParse({ ...valid, message: "x".repeat(4001) }).success,
    ).toBe(false);
    expect(
      enquirySchema.safeParse({ ...valid, name: "x".repeat(121) }).success,
    ).toBe(false);
  });
});
