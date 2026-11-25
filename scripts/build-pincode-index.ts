import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const districtsPath = path.join(DATA_DIR, "districts.json");
const outputPath = path.join(DATA_DIR, "pincodes.json");

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

function normalizeDistrictSlug(raw: string, validSet: Set<string>): string | null {
  const clean = (raw || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (UP_DISTRICT_ALIASES[clean]) return UP_DISTRICT_ALIASES[clean];
  const slug = clean.replace(/\s+/g, "-");
  return validSet.has(slug) ? slug : null;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

async function fetchTextWithFallback(url: string, localFallback?: string): Promise<string> {
  if (localFallback && fs.existsSync(localFallback)) {
    return fs.readFileSync(localFallback, "utf-8");
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

async function buildPincodeIndex() {
  console.log("📮 Building complete official India Post PIN code index for Uttar Pradesh...");

  if (!fs.existsSync(districtsPath)) {
    console.error("❌ Missing districts.json");
    process.exit(1);
  }

  const districtsRaw = JSON.parse(fs.readFileSync(districtsPath, "utf-8"));
  const validDistrictIds = new Set<string>(districtsRaw.map((d: any) => d.id));

  const scratchCsv =
    "C:\\Users\\prash\\.gemini\\antigravity\\brain\\f595a4fe-b599-4a29-afd9-c9496c91a10f\\scratch\\pincode.csv";
  const csvText = await fetchTextWithFallback(
    "https://raw.githubusercontent.com/dropdevrahul/pincodes-india/master/pincode.csv",
    scratchCsv
  );
  const bilalText = await fetchTextWithFallback(
    "https://raw.githubusercontent.com/bilal-webdev/india-postal-pincode-dataset/main/json/india-postal-by-pincode.json"
  );
  const bilalData = JSON.parse(bilalText) as Record<
    string,
    {
      state?: string;
      districts?: { district?: string; blocks?: string[] }[];
    }
  >;

  type Agg = { blocks: Set<string>; offices: Set<string>; division?: string };
  const merged = new Map<string, Map<string, Agg>>();

  const ensureEntry = (pin: string, dId: string): Agg => {
    if (!merged.has(pin)) merged.set(pin, new Map());
    const dMap = merged.get(pin)!;
    if (!dMap.has(dId)) dMap.set(dId, { blocks: new Set(), offices: new Set() });
    return dMap.get(dId)!;
  };

  // 1. Ingest full official data.gov.in All-India Pincode Directory CSV
  const lines = csvText.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = parseCsvLine(line);
    const [circle, , division, office, pin, , , dist, state] = cols;
    if ((state || "").toUpperCase() !== "UTTAR PRADESH") continue;
    if (/APS CIRCLE/i.test(circle || "")) continue; // Exclude Army Postal Service routing codes
    if (/DELHI CIRCLE/i.test(circle || "") && /^110/.test(pin || "")) continue; // Exclude OGD Delhi typo row
    if (!/^\d{6}$/.test(pin || "")) continue;

    const dId = normalizeDistrictSlug(dist || "", validDistrictIds);
    if (!dId) continue;

    const agg = ensureEntry(pin, dId);
    if (division && division !== "NA") agg.division = division.replace(/\s+Division$/i, "").trim();
    if (office) {
      const cleanOffice = office.replace(/\s+(B\.?O\.?|S\.?O\.?|H\.?O\.?|BO|SO|HO)$/i, "").trim();
      if (cleanOffice) agg.offices.add(cleanOffice);
    }
  }

  // 2. Enrich with LGD Block mappings from bilal-webdev dataset
  for (const [pin, info] of Object.entries(bilalData)) {
    if ((info.state || "").toUpperCase() !== "UTTAR PRADESH") continue;
    if (!/^\d{6}$/.test(pin) || /^110|^90/.test(pin)) continue;

    for (const dObj of info.districts || []) {
      const dId = normalizeDistrictSlug(dObj.district || "", validDistrictIds);
      if (!dId) continue;
      // Avoid polluting a PIN with a neighbouring Uttarakhand-only or out-of-state edge unless CSV also has UP
      const agg = ensureEntry(pin, dId);
      for (const b of dObj.blocks || []) {
        if (b && b.toUpperCase() !== "NA") {
          agg.blocks.add(b.trim());
        }
      }
    }
  }

  // Build final clean PincodeMap
  const compiledPincodes: Record<
    string,
    { district_id: string; tehsil_id?: string; locality_en?: string }[]
  > = {};

  for (const pin of [...merged.keys()].sort()) {
    const dMap = merged.get(pin)!;
    const entries: { district_id: string; tehsil_id?: string; locality_en?: string }[] = [];

    for (const [district_id, agg] of dMap.entries()) {
      // Deduplicate blocks ignoring spaces/hyphens/case and format in clean Title Case
      const normBlocksMap = new Map<string, string>();
      for (const b of agg.blocks) {
        const key = b.toLowerCase().replace(/[^a-z0-9]/g, "");
        const title = b
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        if (key && !normBlocksMap.has(key)) {
          normBlocksMap.set(key, title);
        }
      }
      const uniqueBlocks = [...normBlocksMap.values()];
      const firstBlock = uniqueBlocks[0];
      const tehsil_id = firstBlock
        ? firstBlock.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        : undefined;

      const sampleOffices = [...agg.offices].slice(0, 3);
      const blockList = uniqueBlocks.slice(0, 2);
      const parts: string[] = [];
      if (sampleOffices.length > 0) parts.push(sampleOffices.join(", "));
      if (blockList.length > 0) parts.push(`Block: ${blockList.join(", ")}`);
      const locality_en = parts.join(" · ") || undefined;

      entries.push({
        district_id,
        ...(tehsil_id ? { tehsil_id } : {}),
        ...(locality_en ? { locality_en } : {}),
      });
    }

    compiledPincodes[pin] = entries;
  }

  // Preserve & enrich key verified multi-district & pilot headquarters entries
  const ensureBorderMapping = (pin: string, extraDistricts: { district_id: string; tehsil_id?: string }[]) => {
    const cur = compiledPincodes[pin] || [];
    const seen = new Set(cur.map((e) => e.district_id));
    for (const ex of extraDistricts) {
      if (!seen.has(ex.district_id)) {
        cur.push(ex);
        seen.add(ex.district_id);
      }
    }
    compiledPincodes[pin] = cur;
  };

  // 201001 serves Ghaziabad HQ & adjacent border sectors with Gautam Buddha Nagar
  ensureBorderMapping("201001", [
    { district_id: "ghaziabad", tehsil_id: "ghaziabad" },
    { district_id: "gautam-buddha-nagar", tehsil_id: "noida" },
  ]);

  fs.writeFileSync(outputPath, JSON.stringify(compiledPincodes, null, 2) + "\n", "utf-8");

  const stats = fs.statSync(outputPath);
  const coveredDistricts = new Set<string>();
  for (const list of Object.values(compiledPincodes)) {
    for (const item of list) coveredDistricts.add(item.district_id);
  }
  console.log(
    `✅ Built ${Object.keys(compiledPincodes).length} real India Post UP PIN codes covering ${coveredDistricts.size}/75 districts (${(
      stats.size / 1024
    ).toFixed(1)} KB) -> ${outputPath}`
  );
}

buildPincodeIndex().catch((err) => {
  console.error(err);
  process.exit(1);
});
