import { describe, it, expect } from "vitest";
import en from "../locales/en.json";
import hi from "../locales/hi.json";

describe("i18n Parity Test", () => {
  const enKeys = Object.keys(en).sort();
  const hiKeys = Object.keys(hi).sort();

  it("should have identical key counts", () => {
    expect(hiKeys.length).toBe(enKeys.length);
  });

  it("should have identical key sets", () => {
    const missingInHi = enKeys.filter((key) => !(key in hi));
    const extraInHi = hiKeys.filter((key) => !(key in en));

    expect(missingInHi, `Keys present in en.json but missing in hi.json: ${missingInHi.join(", ")}`).toEqual([]);
    expect(extraInHi, `Keys present in hi.json but missing in en.json: ${extraInHi.join(", ")}`).toEqual([]);
  });

  it("should not contain any empty strings", () => {
    for (const [key, val] of Object.entries(en)) {
      expect(typeof val === "string" && val.trim().length > 0, `en.json key '${key}' has empty value`).toBe(true);
    }
    for (const [key, val] of Object.entries(hi)) {
      expect(typeof val === "string" && val.trim().length > 0, `hi.json key '${key}' has empty value`).toBe(true);
    }
  });
});
