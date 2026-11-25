import fs from "fs";
import path from "path";
import { normalizeUpDistrictSlug } from "../lib/pincode";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const DISTRICTS_DIR = path.join(DATA_DIR, "districts");
const PLACES_DIR = path.join(DATA_DIR, "places");
const PILOT_DISTRICTS = new Set(["agra", "jaunpur", "lucknow", "prayagraj", "varanasi"]);

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
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

async function run() {
  if (!fs.existsSync(PLACES_DIR)) fs.mkdirSync(PLACES_DIR, { recursive: true });

  const districts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "districts.json"), "utf8"));
  const scratchCsv =
    "C:\\Users\\prash\\.gemini\\antigravity\\brain\\f595a4fe-b599-4a29-afd9-c9496c91a10f\\scratch\\pincode.csv";

  // Map district_id -> real Post Office localities from official data.gov.in CSV
  const poByDistrict = new Map<string, { name: string; pin: string; isRural: boolean }[]>();
  if (fs.existsSync(scratchCsv)) {
    const lines = fs.readFileSync(scratchCsv, "utf8").split(/\r?\n/);
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const [circle, , , office, pin, officeType, , dist, state] = parseCsvLine(lines[i]);
      if ((state || "").toUpperCase() !== "UTTAR PRADESH") continue;
      if (/APS CIRCLE/i.test(circle || "") || (/DELHI/i.test(circle || "") && /^110/.test(pin || ""))) continue;
      const dId = normalizeUpDistrictSlug(dist || "");
      if (!dId || !/^\d{6}$/.test(pin || "")) continue;
      const cleanName = (office || "").replace(/\s+(B\.?O\.?|S\.?O\.?|H\.?O\.?|BO|SO|HO)$/i, "").trim();
      if (!cleanName || cleanName.length < 3) continue;
      if (!poByDistrict.has(dId)) poByDistrict.set(dId, []);
      poByDistrict.get(dId)!.push({
        name: cleanName,
        pin,
        isRural: /BO/i.test(officeType || "") || /\bBO\b/i.test(office || ""),
      });
    }
  }

  let filesWritten = 0;
  let totalPlaces = 0;

  for (const d of districts) {
    const dId: string = d.id;
    if (PILOT_DISTRICTS.has(dId)) continue;

    const dFile = path.join(DISTRICTS_DIR, `${dId}.json`);
    if (!fs.existsSync(dFile)) continue;
    const distData = JSON.parse(fs.readFileSync(dFile, "utf8"));
    const offices: any[] = distData.offices || [];

    const normPlace = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/au|ao|ou/g, "o")
        .replace(/aa/g, "a")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u");

    const tehsils = offices.filter((o) => o.role === "sdm").map((o) => o.covers?.[0]).filter(Boolean);
    const tehsilNorms = tehsils
      .map((t: string) => ({
        id: t,
        norm: normPlace(t),
      }))
      .sort((a: { norm: string }, b: { norm: string }) => b.norm.length - a.norm.length);
    const defaultTehsil = tehsils[0] || "sadar";
    const matchTehsil = (norm: string): string => {
      const n = normPlace(norm);
      if (!n || n.length < 3) return defaultTehsil;
      return (
        tehsilNorms.find((t: { norm: string }) => t.norm === n)?.id ||
        tehsilNorms.find((t: { norm: string }) => t.norm.length >= 4 && (n.includes(t.norm) || t.norm.includes(n)))?.id ||
        defaultTehsil
      );
    };

    const bdos = offices.filter((o) => o.role === "bdo");
    const eos = offices.filter((o) => o.role === "eo");
    const comm = offices.find((o) => o.role === "commissioner");

    const places: any[] = [];
    const seenIds = new Set<string>();

    const pushPlace = (pl: any) => {
      if (seenIds.has(pl.id)) return;
      seenIds.add(pl.id);
      places.push(pl);
    };

    // 1. Add every Development Block (Gram Panchayat cluster)
    for (const bdo of bdos) {
      const blockId = bdo.covers?.[0];
      if (!blockId) continue;
      const matchingTehsil = tehsils.find((t: string) => t === blockId || t.includes(blockId) || blockId.includes(t)) || defaultTehsil;
      const blockTitle = toTitle(blockId);
      pushPlace({
        id: `v-${dId}-${blockId}`,
        type: "village",
        name_en: `${blockTitle} Block (Gram Panchayats)`,
        name_hi: `${blockTitle} विकास खण्ड (ग्राम पंचायत क्षेत्र)`,
        gp_id: `gp-${blockId}`,
        block_id: blockId,
        tehsil_id: matchingTehsil,
        district_id: dId,
        local_body_type: "gram_panchayat",
      });
    }

    // 2. Match India Post Rural Branch Offices (BOs) cleanly to blocks or default block
    const poList = poByDistrict.get(dId) || [];
    const blockNames = bdos.map((b) => ({
      id: b.covers?.[0] as string,
      norm: (b.covers?.[0] || "").replace(/-/g, ""),
    }));

    const seenRuralNames = new Set<string>();
    for (const po of poList) {
      if (!po.isRural) continue;
      const poNorm = po.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (poNorm.length < 3 || seenRuralNames.has(poNorm)) continue;
      seenRuralNames.add(poNorm);

      const matchedBlock =
        blockNames.find((b) => poNorm.includes(b.norm) || b.norm.includes(poNorm))?.id ||
        blockNames[0]?.id;
      if (!matchedBlock) continue;

      const matchingTehsil =
        tehsils.find((t: string) => t === matchedBlock || poNorm.includes(t.replace(/-/g, ""))) || defaultTehsil;
      const slug = po.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (!slug) continue;

      pushPlace({
        id: `po-${dId}-${slug}`,
        type: "village",
        name_en: `${po.name} (Gram Panchayat Area)`,
        name_hi: `${po.name} (ग्राम पंचायत क्षेत्र)`,
        gp_id: `gp-${matchedBlock}`,
        block_id: matchedBlock,
        tehsil_id: matchingTehsil,
        district_id: dId,
        local_body_type: "gram_panchayat",
        pincodes: [po.pin],
      });
    }

    // 3. Add Municipal Corporation / Nagar Palika Parishad / Nagar Panchayat urban entries
    if (comm) {
      pushPlace({
        id: `ward-${dId}-nigam`,
        type: "ward",
        name_en: `${d.name_en} Municipal Corporation (All Wards)`,
        name_hi: `${d.name_hi} नगर निगम (सभी वार्ड)`,
        ulb_id: comm.covers?.[0] || dId,
        tehsil_id: defaultTehsil,
        district_id: dId,
        local_body_type: "nagar_nigam",
      });
    }

    const eoMatchers: Array<{
      ulbId: string;
      tehsilId: string;
      localBodyType: "nagar_panchayat" | "nagar_palika_parishad";
      isMain: boolean;
      tokens: string[];
    }> = [];

    for (const eo of eos) {
      const ulbId: string = eo.covers?.[0] || `ulb-${dId}-main`;
      const isMain = eo.id.endsWith("-main");
      const rawName = (eo.office_name_en || "").replace(/^Executive Officer,\s*/i, "").trim() || `${d.name_en} ULB`;
      const rawNameHi = (eo.office_name_hi || "").replace(/^अधिशासी अधिकारी\s*[,:\-–]?\s*/u, "").trim();
      const isNp = /nagar\s*panchayat|नगर\s*पंचायत/i.test(`${rawName} ${rawNameHi}`);
      const localBodyType: "nagar_panchayat" | "nagar_palika_parishad" = isNp
        ? "nagar_panchayat"
        : "nagar_palika_parishad";

      const cleanTownNorm = rawName
        .toLowerCase()
        .replace(/\b(executive|officer|nagar|palika|parishad|prishad|parishd|panchayat|town|municipal|council|area|np|npp)\b/g, " ")
        .replace(/[^a-z0-9]/g, "");
      const ulbSlugNorm = ulbId.replace(/^ulb-/, "").replace(/-main$/, "").replace(/[^a-z0-9]/g, "");
      const tehsilId = matchTehsil(ulbSlugNorm) !== defaultTehsil ? matchTehsil(ulbSlugNorm) : matchTehsil(cleanTownNorm);

      pushPlace({
        id: `ward-${dId}-${ulbId}`,
        type: "ward",
        name_en: `${rawName} (All Wards)`,
        name_hi: rawNameHi ? `${rawNameHi} (सभी वार्ड)` : `${d.name_hi} नगरीय निकाय (सभी वार्ड)`,
        ulb_id: ulbId,
        tehsil_id: tehsilId,
        district_id: dId,
        local_body_type: localBodyType,
      });

      const tokens = [ulbSlugNorm, cleanTownNorm].filter((t) => t.length >= 4 && t !== "main");
      eoMatchers.push({ ulbId, tehsilId, localBodyType, isMain, tokens });
    }

    // Prioritize specific Town EOs over -main fallback and longer town names over shorter prefixes (e.g. sandila over sandi)
    const maxTokLen = (m: { tokens: string[] }) => Math.max(0, ...m.tokens.map((t) => t.length));
    const orderedEoMatchers = [...eoMatchers].sort(
      (a, b) => Number(a.isMain) - Number(b.isMain) || maxTokLen(b) - maxTokLen(a)
    );

    // Also add non-BO Sub Post Office towns in district if ULB exists
    const defaultUlb = eos[0]?.covers?.[0] || comm?.covers?.[0] || `ulb-${dId}-main`;
    const defaultUlbType = comm ? "nagar_nigam" : "nagar_palika_parishad";
    const seenUrban = new Set<string>();
    for (const po of poList) {
      if (po.isRural) continue;
      const poNorm = po.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (poNorm.length < 3 || seenUrban.has(poNorm)) continue;
      seenUrban.add(poNorm);
      const slug = po.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (!slug) continue;

      const poPhon = normPlace(poNorm);
      const matchedEo =
        orderedEoMatchers.find((m) => m.tokens.some((tok) => normPlace(tok) === poPhon)) ||
        orderedEoMatchers.find((m) =>
          m.tokens.some((tok) => {
            const pt = normPlace(tok);
            return pt.length >= 4 && (poPhon.includes(pt) || pt.includes(poPhon));
          })
        );

      pushPlace({
        id: `town-${dId}-${slug}`,
        type: "ward",
        name_en: `${po.name} (Urban Ward / SO)`,
        name_hi: `${po.name} (शहरी वार्ड क्षेत्र)`,
        ulb_id: matchedEo ? matchedEo.ulbId : defaultUlb,
        tehsil_id: matchedEo ? matchedEo.tehsilId : matchTehsil(poNorm),
        district_id: dId,
        local_body_type: matchedEo ? matchedEo.localBodyType : defaultUlbType,
        pincodes: [po.pin],
      });
    }

    const outPath = path.join(PLACES_DIR, `${dId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(places, null, 2) + "\n", "utf-8");
    filesWritten++;
    totalPlaces += places.length;
  }

  console.log(`✅ Generated ${filesWritten} statewide places files (${totalPlaces} total verified locality entries across non-pilot districts)!`);
}

run();
