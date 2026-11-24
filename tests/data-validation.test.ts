import { describe, it, expect } from "vitest";
import { officeSchema, phoneSchema, issueStepSchema } from "../lib/validate";

describe("Data Validation Schema Tests", () => {
  it("should validate a compliant phone record", () => {
    const validPhone = {
      number: "0542-2508585",
      type: "office",
      source_url: "https://varanasi.nic.in/directory",
      checked_on: "2026-11-20",
      status: "verified",
    };
    const res = phoneSchema.safeParse(validPhone);
    expect(res.success).toBe(true);
  });

  it("should reject a phone with invalid format or missing source_url", () => {
    const badPhone = {
      number: "12345", // too short, invalid format
      type: "office",
      source_url: "not-a-url",
      checked_on: "2026-11-20",
      status: "verified",
    };
    const res = phoneSchema.safeParse(badPhone);
    expect(res.success).toBe(false);
  });

  it("should fail validation if an office is vacant but lacks fallback_office_id", () => {
    const vacantOfficeWithoutFallback = {
      id: "up-test-sec",
      level: "gram_panchayat",
      role: "secretary",
      office_name_en: "Gram Panchayat Secretary",
      office_name_hi: "ग्राम पंचायत सचिव",
      phones: [],
      covers: ["gp-test"],
      post_status: "vacant", // vacant but no fallback_office_id
      source_url: "https://panchayat.up.nic.in",
      confidence: "medium",
      valid_as_of: "2026-11-20",
    };
    const res = officeSchema.safeParse(vacantOfficeWithoutFallback);
    expect(res.success).toBe(false);
  });

  it("should fail validation if time_limit_days is set without time_limit_source_url", () => {
    const stepWithUnverifiedTimeLimit = {
      order: 1,
      role: "secretary",
      how_en: "Submit application",
      how_hi: "आवेदन दें",
      time_limit_days: 15,
      time_limit_source_url: null, // missing source url
    };
    const res = issueStepSchema.safeParse(stepWithUnverifiedTimeLimit);
    expect(res.success).toBe(false);
  });
});
