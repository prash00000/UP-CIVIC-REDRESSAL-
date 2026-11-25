import { PincodeMap } from "./types";

export type PincodeMatch = {
  district_id: string;
  tehsil_id?: string;
  locality_en?: string;
};

export type PincodeLookupResult = {
  kind: "exact" | "prefix" | "invalid_prefix" | "not_found";
  matches: PincodeMatch[];
};

const CANONICAL_UP_DISTRICTS = new Set([
  "agra", "aligarh", "ambedkar-nagar", "amethi", "amroha", "auraiya", "ayodhya",
  "azamgarh", "baghpat", "bahraich", "ballia", "balrampur", "banda", "barabanki",
  "bareilly", "basti", "bhadohi", "bijnor", "budaun", "bulandshahr", "chandauli",
  "chitrakoot", "deoria", "etah", "etawah", "farrukhabad", "fatehpur", "firozabad",
  "gautam-buddha-nagar", "ghaziabad", "ghazipur", "gonda", "gorakhpur", "hamirpur",
  "hapur", "hardoi", "hathras", "jalaun", "jaunpur", "jhansi", "kannauj",
  "kanpur-dehat", "kanpur-nagar", "kasganj", "kaushambi", "kushinagar",
  "lakhimpur-kheri", "lalitpur", "lucknow", "maharajganj", "mahoba", "mainpuri",
  "mathura", "mau", "meerut", "mirzapur", "moradabad", "muzaffarnagar", "pilibhit",
  "pratapgarh", "prayagraj", "raebareli", "rampur", "saharanpur", "sambhal",
  "sant-kabir-nagar", "shahjahanpur", "shamli", "shravasti", "siddharthnagar",
  "sitapur", "sonbhadra", "sultanpur", "unnao", "varanasi",
]);

export const UP_DISTRICT_ALIASES: Record<string, string> = {
  "kheri": "lakhimpur-kheri",
  "lakhimpur kheri": "lakhimpur-kheri",
  "kushi nagar": "kushinagar",
  "kushinagar": "kushinagar",
  "rae bareli": "raebareli",
  "raebareli": "raebareli",
  "sant kabeer nagar": "sant-kabir-nagar",
  "sant kabir nagar": "sant-kabir-nagar",
  "siddharth nagar": "siddharthnagar",
  "siddharthnagar": "siddharthnagar",
  "allahabad": "prayagraj",
  "prayagraj": "prayagraj",
  "faizabad": "ayodhya",
  "ayodhya": "ayodhya",
  "sant ravidas nagar": "bhadohi",
  "sant ravidas nagar bhadohi": "bhadohi",
  "bhadohi": "bhadohi",
  "jyotiba phule nagar": "amroha",
  "amroha": "amroha",
  "kanshiram nagar": "kasganj",
  "kasganj": "kasganj",
  "mahamaya nagar": "hathras",
  "hathras": "hathras",
  "prabuddh nagar": "shamli",
  "shamli": "shamli",
  "panchsheel nagar": "hapur",
  "hapur": "hapur",
  "bhim nagar": "sambhal",
  "sambhal": "sambhal",
  "csm nagar": "amethi",
  "chatrapati shahuji maharaj nagar": "amethi",
  "amethi": "amethi",
  "badaun": "budaun",
  "budaun": "budaun",
  "bulandshahar": "bulandshahr",
  "bulandshahr": "bulandshahr",
  "bagpat": "baghpat",
  "baghpat": "baghpat",
  "shrawasti": "shravasti",
  "shravasti": "shravasti",
  "bara banki": "barabanki",
  "barabanki": "barabanki",
  "mahrajganj": "maharajganj",
  "maharajganj": "maharajganj",
  "gautam buddha nagar": "gautam-buddha-nagar",
  "kanpur nagar": "kanpur-nagar",
  "kanpur dehat": "kanpur-dehat",
  "ambedkar nagar": "ambedkar-nagar",
  "ramabai nagar": "kanpur-dehat",
};

/**
 * Normalize an official India Post / Census UP district name to our canonical district_id slug.
 */
export function normalizeUpDistrictSlug(rawDistrict: string): string | null {
  const clean = (rawDistrict || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return null;
  if (UP_DISTRICT_ALIASES[clean]) return UP_DISTRICT_ALIASES[clean];
  const slug = clean.replace(/\s+/g, "-");
  return CANONICAL_UP_DISTRICTS.has(slug) ? slug : null;
}

/**
 * Resolve a 6-digit UP PIN code to district/tehsil/locality suggestions.
 * 1. Checks exact 6-digit India Post match in `pincodes.json` FIRST
 *    (covers all 1,653+ UP PINs including cross-circle border PINs like 802131 in Ballia).
 * 2. Validates UP postal circle range (20xxxx - 28xxxx) before falling back to prefix lookup.
 * 3. Falls back to the 3-digit postal sorting prefix derived strictly from verified entries.
 */
export function resolvePincode(
  rawPin: string,
  pincodesMap: PincodeMap
): PincodeLookupResult {
  const clean = rawPin.replace(/\D/g, "").trim();
  if (clean.length !== 6) {
    return { kind: "not_found", matches: [] };
  }

  // Tier 1: exact 6-digit India Post lookup (checked before prefix rule so cross-circle UP PINs work)
  const exact = pincodesMap[clean];
  if (exact && exact.length > 0) {
    return { kind: "exact", matches: exact };
  }

  // Validate UP postal circle range (20xxxx - 28xxxx) for fallback matching
  const twoDigit = Number(clean.slice(0, 2));
  if (twoDigit < 20 || twoDigit > 28) {
    return { kind: "invalid_prefix", matches: [] };
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
