import { describe, it, expect } from "vitest";
import pincodesData from "../public/data/pincodes.json";
import districtsData from "../public/data/districts.json";
import { PincodeMap } from "../lib/types";
import { resolvePincode, normalizeUpDistrictSlug } from "../lib/pincode";

describe("Pincode Search & Directory Parity Tests", () => {
  const pincodes = pincodesData as unknown as PincodeMap;
  const validDistrictIds = new Set(districtsData.map((d: any) => d.id));

  it("should have complete official India Post coverage of 1,500+ UP pincodes across all 75 districts", () => {
    const totalPins = Object.keys(pincodes).length;
    expect(totalPins).toBeGreaterThanOrEqual(1500);

    const covered = new Set<string>();
    for (const entries of Object.values(pincodes)) {
      for (const e of entries) covered.add(e.district_id);
    }
    expect(covered.size).toBe(75);
  });

  it("should resolve real UP PIN codes directly (including formerly missed districts & cross-circle PINs)", () => {
    // Lucknow (Aliganj - 226024 & GPO - 226001)
    expect(resolvePincode("226001", pincodes).kind).toBe("exact");
    expect(resolvePincode("226024", pincodes).kind).toBe("exact");
    expect(resolvePincode("226024", pincodes).matches[0].district_id).toBe("lucknow");

    // Kanpur Nagar
    const kanpur = resolvePincode("208005", pincodes);
    expect(kanpur.kind).toBe("exact");
    expect(kanpur.matches[0].district_id).toBe("kanpur-nagar");

    // Azamgarh (223xxx prefix previously missing)
    const azamgarh = resolvePincode("223221", pincodes);
    expect(azamgarh.kind).toBe("exact");
    expect(azamgarh.matches[0].district_id).toBe("azamgarh");

    // Cross-circle border UP PIN (Sheopur Diar, Ballia -> 802131)
    const balliaBorder = resolvePincode("802131", pincodes);
    expect(balliaBorder.kind).toBe("exact");
    expect(balliaBorder.matches[0].district_id).toBe("ballia");
  });

  it("should support multi-district border PIN codes (e.g. 201001)", () => {
    const multi = pincodes["201001"];
    expect(multi).toBeDefined();
    expect(multi.length).toBeGreaterThanOrEqual(2);
    const districtIds = multi.map((m) => m.district_id);
    expect(districtIds).toContain("ghaziabad");
    expect(districtIds).toContain("gautam-buddha-nagar");
  });

  it("should ensure every mapped district_id exists in districts.json", () => {
    for (const [pin, mappings] of Object.entries(pincodes)) {
      expect(/^\d{6}$/.test(pin), `PIN code '${pin}' must be 6 digits`).toBe(true);
      for (const map of mappings) {
        expect(
          validDistrictIds.has(map.district_id),
          `PIN '${pin}' references unknown district_id '${map.district_id}'`
        ).toBe(true);
      }
    }
  });

  it("should fall back to 3-digit postal prefix for unlisted UP suffixes and reject out-of-state prefixes", () => {
    const prefixLucknow = resolvePincode("226099", pincodes);
    expect(prefixLucknow.kind).toBe("prefix");
    expect(prefixLucknow.matches.map((m) => m.district_id)).toContain("lucknow");

    const delhiPin = resolvePincode("110001", pincodes);
    expect(delhiPin.kind).toBe("invalid_prefix");
    expect(delhiPin.matches).toEqual([]);
  });

  it("should normalize historical and India Post UP district aliases accurately", () => {
    expect(normalizeUpDistrictSlug("Allahabad")).toBe("prayagraj");
    expect(normalizeUpDistrictSlug("Faizabad")).toBe("ayodhya");
    expect(normalizeUpDistrictSlug("KHERI")).toBe("lakhimpur-kheri");
    expect(normalizeUpDistrictSlug("MAHRAJGANJ")).toBe("maharajganj");
    expect(normalizeUpDistrictSlug("SANT KABEER NAGAR")).toBe("sant-kabir-nagar");
  });
});
