import { PincodeMap } from "./types";

export type PincodeMatch = {
  district_id: string;
  tehsil_id?: string;
};

export type PincodeLookupResult = {
  kind: "exact" | "prefix" | "invalid_prefix" | "not_found";
  matches: PincodeMatch[];
};

/**
 * Resolve a 6-digit UP PIN code to district/tehsil suggestions.
 * 1. Checks exact 6-digit India Post match in `pincodes.json` (preserves tehsil_id).
 * 2. Falls back to the 3-digit postal sorting prefix derived strictly from `pincodes.json`
 *    (narrows district without guessing unverified tehsil).
 */
export function resolvePincode(
  rawPin: string,
  pincodesMap: PincodeMap
): PincodeLookupResult {
  const clean = rawPin.replace(/\D/g, "").trim();
  if (clean.length !== 6) {
    return { kind: "not_found", matches: [] };
  }

  // Validate UP postal circle range (20xxxx - 28xxxx)
  const twoDigit = Number(clean.slice(0, 2));
  if (twoDigit < 20 || twoDigit > 28) {
    return { kind: "invalid_prefix", matches: [] };
  }

  // Tier 1: exact 6-digit lookup
  const exact = pincodesMap[clean];
  if (exact && exact.length > 0) {
    return { kind: "exact", matches: exact };
  }

  // Tier 2: 3-digit postal sorting prefix derived from verified entries
  const prefix3 = clean.slice(0, 3);
  const districtSet = new Set<string>();
  for (const [pin, entries] of Object.entries(pincodesMap)) {
    if (pin.startsWith(prefix3)) {
      for (const entry of entries) {
        districtSet.add(entry.district_id);
      }
    }
  }

  if (districtSet.size > 0) {
    const matches: PincodeMatch[] = Array.from(districtSet).map((district_id) => ({
      district_id,
    }));
    return { kind: "prefix", matches };
  }

  return { kind: "not_found", matches: [] };
}
