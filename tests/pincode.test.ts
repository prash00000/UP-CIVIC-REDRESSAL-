import { describe, it, expect } from "vitest";
import pincodesData from "../public/data/pincodes.json";
import districtsData from "../public/data/districts.json";
import { PincodeMap } from "../lib/types";

describe("Pincode Search & Directory Parity Tests", () => {
  const pincodes = pincodesData as unknown as PincodeMap;
  const validDistrictIds = new Set(districtsData.map((d: any) => d.id));

  it("should have comprehensive statewide coverage of 700+ UP pincodes", () => {
    const totalPins = Object.keys(pincodes).length;
    expect(totalPins).toBeGreaterThanOrEqual(700);
  });

  it("should resolve single district PIN codes properly", () => {
    // Lucknow
    expect(pincodes["226001"]).toBeDefined();
    expect(pincodes["226001"][0].district_id).toBe("lucknow");

    // Jaunpur
    expect(pincodes["222001"]).toBeDefined();
    expect(pincodes["222001"][0].district_id).toBe("jaunpur");

    // Varanasi
    expect(pincodes["221001"]).toBeDefined();
    expect(pincodes["221001"][0].district_id).toBe("varanasi");

    // Agra
    expect(pincodes["282001"]).toBeDefined();
    expect(pincodes["282001"][0].district_id).toBe("agra");
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
});
