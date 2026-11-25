import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { normalizeUpDistrictSlug } from "../lib/pincode";

const requireCjs = createRequire(path.join(process.cwd(), "package.json"));
const { parquetReadObjects } = requireCjs("hyparquet");
const { compressors } = requireCjs("hyparquet-compressors");

const DATA_DIR = path.join(process.cwd(), "public", "data");
const DISTRICTS_DIR = path.join(DATA_DIR, "districts");
const PLACES_DIR = path.join(DATA_DIR, "places");
const CACHE_DIR = path.join(process.cwd(), ".cache", "lgd");
const PILOT_DISTRICTS = new Set(["agra", "jaunpur", "lucknow", "prayagraj", "varanasi"]);

const LGD_META_URL = "https://ramseraph.github.io/opendata/lgd/data/metadata.json";

const BLOCK_PHONETIC_ALIASES: Record<string, string[]> = {
  "bakshikatalab": ["bkt", "bakshikatalab"],
  "bakhshikatalab": ["bkt", "bakshikatalab"],
  "tandiyawan": ["tadiyawan"],
  "madhavganj": ["madhoganj"],
  "behandar": ["behadar"],
  "toderpur": ["tondarpur"],
  "sarbankhera": ["sarvankheda", "sarvankhera"],
  "ikona": ["ikauna", "ikouna"],
  "hariharpurrani": ["hariharpur"],
  "kashividyapith": ["kashividyapeeth", "vidyapith"],
  "araziline": ["arajiline"],
  "deoriasadar": ["deoria"],
  "bhatparrani": ["bhatpar"],
  "machhrehta": ["machharehata", "machhrehata"],
  "mahmudabad": ["mahmoodabad"],
  "sidhauli": ["sidholi"],
  "nawabganj": ["navabganj"],
  "fatehpur": ["phatehpur"],
};

function normPlace(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\b(block|vikas|khand|tehsil|tahsil|sadar|rural|nagar|palika|parishad|prishad|parishd|panchayat|nigam|town|mb|np|npp)\b/g, " ")
    .replace(/[^a-z0-9]/g, "")
    .replace(/ganv|gaav/g, "gaon")
    .replace(/z/g, "j")
    .replace(/kh/g, "k")
    .replace(/sh/g, "s")
    .replace(/chh?/g, "c")
    .replace(/ph/g, "f")
    .replace(/v/g, "w")
    .replace(/au|ao|ou/g, "o")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/aa/g, "a");
}

function toSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

async function loadLgdParquet(meta: any, datasetName: string): Promise<any[]> {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${datasetName}.parquet`);
  let ab: ArrayBuffer;
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 1000) {
    const buf = fs.readFileSync(cachePath);
    ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } else {
    const url = meta?.datasets?.[datasetName]?.daily?.file?.url;
    if (!url) throw new Error(`Missing LGD dataset URL for ${datasetName}`);
    console.log(`⬇️  Downloading LGD ${datasetName}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed LGD ${datasetName}: HTTP ${res.status}`);
    ab = await res.arrayBuffer();
    fs.writeFileSync(cachePath, Buffer.from(ab));
  }
  return parquetReadObjects({ file: ab, compressors });
}

async function run() {
  if (!fs.existsSync(PLACES_DIR)) fs.mkdirSync(PLACES_DIR, { recursive: true });
  const districts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "districts.json"), "utf8"));
  const validDistSet = new Set<string>(districts.map((d: any) => d.id));

  // 1. Load official India Post CSV if cached locally
  const scratchCsv =
    "C:\\Users\\prash\\.gemini\\antigravity\\brain\\f595a4fe-b599-4a29-afd9-c9496c91a10f\\scratch\\pincode.csv";
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

  // 2. Load Official LGD State 09 (Uttar Pradesh) datasets (Villages, Blocks, GPs, PINs, ULBs, Wards)
  let meta: any = null;
  try {
    meta = await (await fetch(LGD_META_URL)).json();
  } catch (e) {
    console.warn("⚠️ Could not fetch LGD metadata, checking local cache only...");
  }

  const vbbRows = meta
    ? (await loadLgdParquet(meta, "villages_by_blocks")).filter((r: any) => String(r.state_code) === "9")
    : [];
  const villRows = meta
    ? (await loadLgdParquet(meta, "villages")).filter((r: any) => String(r.state_code) === "9")
    : [];
  const pinVillRows = meta
    ? (await loadLgdParquet(meta, "pincode_villages")).filter((r: any) => String(r.state_code) === "9")
    : [];
  const ulbRows = meta
    ? (await loadLgdParquet(meta, "urban_local_bodies")).filter((r: any) => String(r.state_code) === "9")
    : [];
  const ulbCovRows = meta
    ? (await loadLgdParquet(meta, "statewise_ulbs_coverage")).filter((r: any) => /uttar pradesh/i.test(r.state_name || ""))
    : [];
  const pinUrbanRows = meta
    ? (await loadLgdParquet(meta, "pincode_urban")).filter((r: any) => String(r.state_code) === "9")
    : [];

  // Build village_code -> Hindi name and verified PINs
  const hiVillageByCode = new Map<string, string>();
  for (const r of villRows) {
    const code = String(r.village_code || "");
    const local = String(r.village_name_local || "").trim();
    if (code && local && /[\u0900-\u097f]/.test(local)) {
      hiVillageByCode.set(code, local);
    }
  }

  const pinsByVillageCode = new Map<string, Set<string>>();
  const pinVillLookup: Array<{ pin: string; dId: string; tehsilName: string; villageName: string }> = [];
  for (const r of pinVillRows) {
    const code = String(r.village_code || "");
    const pin = String(r.pincode || "").trim();
    if (!/^\d{6}$/.test(pin)) continue;
    if (code) {
      if (!pinsByVillageCode.has(code)) pinsByVillageCode.set(code, new Set());
      pinsByVillageCode.get(code)!.add(pin);
    }
    const dId = normalizeUpDistrictSlug(r.district_name || "");
    if (dId && validDistSet.has(dId)) {
      pinVillLookup.push({
        pin,
        dId,
        tehsilName: String(r.subdistrict_name || "").trim(),
        villageName: String(r.village_name || "").trim(),
      });
    }
  }

  // Group LGD villages by district
  const lgdVillagesByDistrict = new Map<string, any[]>();
  for (const r of vbbRows) {
    const dId = normalizeUpDistrictSlug(r.district_name || "");
    if (!dId || !validDistSet.has(dId)) continue;
    if (!lgdVillagesByDistrict.has(dId)) lgdVillagesByDistrict.set(dId, []);
    lgdVillagesByDistrict.get(dId)!.push(r);
  }

  // Group LGD ULBs by district (via statewise_ulbs_coverage + pincode_urban)
  const ulbByCode = new Map<string, any>();
  for (const u of ulbRows) ulbByCode.set(String(u.local_body_code), u);

  const pinsByUlbCode = new Map<string, Set<string>>();
  for (const pu of pinUrbanRows) {
    const code = String(pu.local_body_code || "");
    const pin = String(pu.pincode || "").trim();
    if (!code || !/^\d{6}$/.test(pin)) continue;
    if (!pinsByUlbCode.has(code)) pinsByUlbCode.set(code, new Set());
    pinsByUlbCode.get(code)!.add(pin);
  }

  const lgdUlbsByDistrict = new Map<
    string,
    Map<string, { code: string; nameEn: string; nameHi: string; typeCode: string; subdistrict: string }>
  >();
  for (const c of ulbCovRows) {
    const dId = normalizeUpDistrictSlug(c.district_name || "");
    const code = String(c.local_body_code || "");
    const ulbMeta = ulbByCode.get(code);
    if (!dId || !validDistSet.has(dId) || !ulbMeta) continue;
    if (!lgdUlbsByDistrict.has(dId)) lgdUlbsByDistrict.set(dId, new Map());
    const map = lgdUlbsByDistrict.get(dId)!;
    const prev = map.get(code);
    const subName = String(c.subdistrict_name || "").trim();
    if (!prev || (!prev.subdistrict && subName)) {
      const localName = String(ulbMeta.local_body_name_local || "").trim();
      map.set(code, {
        code,
        nameEn: String(ulbMeta.local_body_name || c.local_body_name || "").trim(),
        nameHi: /[\u0900-\u097f]/.test(localName) ? localName : "",
        typeCode: String(ulbMeta.local_body_type_code || "5"),
        subdistrict: subName,
      });
    }
  }

  // Enrich pincodes.json cleanly with any missing valid UP PINs from LGD
  const pincodesPath = path.join(DATA_DIR, "pincodes.json");
  const pincodesMap: Record<string, Array<{ district_id: string; tehsil_id?: string; locality_en?: string }>> = fs.existsSync(pincodesPath)
    ? JSON.parse(fs.readFileSync(pincodesPath, "utf8"))
    : {};
  let lgdPinsAdded = 0;
  for (const pv of pinVillLookup) {
    if (/^2[0-8]\d{4}$/.test(pv.pin) && !pincodesMap[pv.pin]) {
      pincodesMap[pv.pin] = [
        {
          district_id: pv.dId,
          ...(pv.tehsilName ? { tehsil_id: toSlug(pv.tehsilName) } : {}),
          ...(pv.villageName ? { locality_en: pv.villageName } : {}),
        },
      ];
      lgdPinsAdded++;
    }
  }
  fs.writeFileSync(pincodesPath, JSON.stringify(pincodesMap) + "\n", "utf8");

  let filesWritten = 0;
  let totalPlaces = 0;
  let totalVillages = 0;
  let totalWards = 0;

  for (const d of districts) {
    const dId: string = d.id;
    const dFile = path.join(DISTRICTS_DIR, `${dId}.json`);
    if (!fs.existsSync(dFile)) continue;
    const distData = JSON.parse(fs.readFileSync(dFile, "utf8"));
    const offices: any[] = distData.offices || [];

    const tehsils = offices.filter((o) => o.role === "sdm").map((o) => o.covers?.[0]).filter(Boolean);
    const tehsilNorms = tehsils
      .map((t: string) => ({ id: t, norm: normPlace(t) }))
      .sort((a: { norm: string }, b: { norm: string }) => b.norm.length - a.norm.length);
    const defaultTehsil = tehsils[0] || "sadar";

    const matchTehsil = (raw: string): string => {
      const n = normPlace(raw);
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

    const bdoNorms = bdos.map((b) => {
      const id = (b.covers?.[0] as string) || "";
      const n = normPlace(id);
      const aliases = [
        n,
        normPlace(b.office_name_en || ""),
        ...(BLOCK_PHONETIC_ALIASES[n] || []).map(normPlace),
      ].filter((x) => x.length >= 3);
      return { id, aliases };
    });

    const matchBlock = (rawBlock: string): string => {
      const n = normPlace(rawBlock);
      if (!n) return bdos[0]?.covers?.[0] || toSlug(rawBlock);
      const candSet = [n, ...(BLOCK_PHONETIC_ALIASES[n] || []).map(normPlace)];
      for (const cand of candSet) {
        const exact = bdoNorms.find((b) => b.aliases.includes(cand));
        if (exact) return exact.id;
      }
      const fuzzy = bdoNorms.find((b) =>
        b.aliases.some((a) => a.length >= 4 && (n.includes(a) || a.includes(n)))
      );
      return fuzzy ? fuzzy.id : bdos[0]?.covers?.[0] || toSlug(rawBlock);
    };

    const places: any[] = [];
    const seenIds = new Set<string>();
    const seenVillageKeys = new Set<string>(); // prevent PO duplication when LGD village already covers it

    const pushPlace = (pl: any) => {
      if (seenIds.has(pl.id)) return;
      seenIds.add(pl.id);
      places.push(pl);
      if (pl.type === "village") totalVillages++;
      else totalWards++;
    };

    // Keep legacy pilot entries at top for backward compatibility of bookmarks & existing tests
    const outPath = path.join(PLACES_DIR, `${dId}.json`);
    if (PILOT_DISTRICTS.has(dId) && fs.existsSync(outPath)) {
      const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
      for (const pl of existing) {
        // Keep original pilot fixture entries + wards (LGD real villages will append cleanly after)
        if (/^(?:v-|w-|cantt-)/.test(pl.id)) {
          pushPlace(pl);
        }
      }
    }

    // 1. Add every Development Block (Direct Block/BDO Entry so citizens can always pick their Block!)
    for (const bdo of bdos) {
      const blockId = bdo.covers?.[0];
      if (!blockId) continue;
      const bTitle = bdo.office_name_en
        .replace(/^Block Development Officer,?\s*/i, "")
        .replace(/^Block\s+/i, "")
        .trim();
      const bTitleHi = (bdo.office_name_hi || "")
        .replace(/^खंड विकास अधिकारी,?\s*|^खण्ड विकास अधिकारी,?\s*/u, "")
        .replace(/^ब्लॉक\s*/u, "")
        .trim();
      const matchingTehsil = matchTehsil(blockId);

      pushPlace({
        id: `block-${dId}-${blockId}`,
        type: "village",
        name_en: `${bTitle} (Full Block / All Gram Panchayats)`,
        name_hi: `${bTitleHi || bTitle} (पूरा विकास खंड / सभी ग्राम पंचायतें)`,
        gp_id: `gp-${blockId}`,
        block_id: blockId,
        tehsil_id: matchingTehsil,
        district_id: dId,
        local_body_type: "gram_panchayat",
      });
    }

    // 2. Add Official LGD Census Villages & Gram Panchayats for this district
    const lgdVillages = lgdVillagesByDistrict.get(dId) || [];
    for (const rv of lgdVillages) {
      const vCode = String(rv.village_code || "").trim();
      const vName = String(rv.village_name || "").trim();
      const gpName = String(rv.local_body_name || "").trim();
      const blkName = String(rv.block_name || "").trim();
      const subName = String(rv.subdistrict_name || "").trim();
      if (!vCode || !vName) continue;

      const matchedBlock = matchBlock(blkName);
      const matchedTehsil = matchTehsil(subName || blkName);
      const gpSlug = toSlug(gpName || matchedBlock) || matchedBlock;
      const hiName = hiVillageByCode.get(vCode);
      const pins = pinsByVillageCode.get(vCode);
      const gpSuffixEn = gpName && normPlace(gpName) !== normPlace(vName) ? ` (GP: ${gpName})` : ` (GP)`;
      const gpSuffixHi = gpName && normPlace(gpName) !== normPlace(vName) ? ` (ग्रा.पं.: ${gpName})` : ` (ग्राम पंचायत)`;

      seenVillageKeys.add(`${normPlace(vName)}::${matchedBlock}`);
      seenVillageKeys.add(normPlace(vName));

      pushPlace({
        id: `lgd-${vCode}`,
        type: "village",
        name_en: `${vName}${gpSuffixEn}`,
        name_hi: `${hiName || vName}${gpSuffixHi}`,
        gp_id: `gp-${gpSlug}`,
        block_id: matchedBlock,
        tehsil_id: matchedTehsil,
        district_id: dId,
        local_body_type: "gram_panchayat",
        ...(pins && pins.size > 0 ? { pincodes: [...pins].slice(0, 4) } : {}),
      });
    }

    // 3. Add India Post Branch Post Office (BO) villages not already covered by LGD
    const poList = poByDistrict.get(dId) || [];
    const blockNames = bdos.map((b) => ({
      id: b.covers?.[0] as string,
      norm: (b.covers?.[0] || "").replace(/-/g, ""),
    }));
    const seenRuralNames = new Set<string>();
    for (const po of poList) {
      if (!po.isRural) continue;
      const poNorm = normPlace(po.name);
      if (poNorm.length < 3 || seenRuralNames.has(poNorm) || seenVillageKeys.has(poNorm)) continue;
      seenRuralNames.add(poNorm);

      const matchedBlock =
        blockNames.find((b) => poNorm.includes(b.norm) || b.norm.includes(poNorm))?.id ||
        blockNames[0]?.id;
      if (!matchedBlock) continue;

      const matchingTehsil = matchTehsil(po.name);
      const slug = toSlug(po.name);
      if (!slug) continue;

      pushPlace({
        id: `po-${dId}-${slug}`,
        type: "village",
        name_en: `${po.name} (Post / GP Area)`,
        name_hi: `${po.name} (डाक / ग्राम पंचायत क्षेत्र)`,
        gp_id: `gp-${matchedBlock}`,
        block_id: matchedBlock,
        tehsil_id: matchingTehsil,
        district_id: dId,
        local_body_type: "gram_panchayat",
        pincodes: [po.pin],
      });
    }

    // 4. Add Municipal Corporation / Harvested ULB EOs / LGD ULBs
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

      const cleanTownNorm = normPlace(rawName);
      const ulbSlugNorm = normPlace(ulbId.replace(/^ulb-/, "").replace(/-main$/, ""));
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

    const maxTokLen = (m: { tokens: string[] }) => Math.max(0, ...m.tokens.map((t) => t.length));
    const orderedEoMatchers = [...eoMatchers].sort(
      (a, b) => Number(a.isMain) - Number(b.isMain) || maxTokLen(b) - maxTokLen(a)
    );

    const matchEoForToken = (tokenNorm: string) =>
      orderedEoMatchers.find((m) => m.tokens.some((tok) => tok === tokenNorm)) ||
      orderedEoMatchers.find((m) => m.tokens.some((tok) => tok.length >= 4 && (tokenNorm.includes(tok) || tok.includes(tokenNorm))));

    // 4b. Append all official LGD ULBs in district (covers all 770 UP ULBs even if sub-town EO was on -main)
    const defaultUlb = eos[0]?.covers?.[0] || comm?.covers?.[0] || `ulb-${dId}-main`;
    const defaultUlbType = comm ? "nagar_nigam" : "nagar_palika_parishad";
    const districtUlbs = lgdUlbsByDistrict.get(dId);
    if (districtUlbs) {
      for (const u of districtUlbs.values()) {
        const uNorm = normPlace(u.nameEn);
        const matchedEo = matchEoForToken(uNorm);
        const lgdType =
          u.typeCode === "4"
            ? "nagar_nigam"
            : u.typeCode === "7"
            ? "nagar_panchayat"
            : u.typeCode === "6"
            ? "authority_area"
            : "nagar_palika_parishad";
        const typeLabelEn =
          lgdType === "nagar_nigam"
            ? "Nagar Nigam"
            : lgdType === "nagar_panchayat"
            ? "Nagar Panchayat"
            : lgdType === "authority_area"
            ? "Industrial Authority"
            : "Nagar Palika Parishad";
        const typeLabelHi =
          lgdType === "nagar_nigam"
            ? "नगर निगम"
            : lgdType === "nagar_panchayat"
            ? "नगर पंचायत"
            : lgdType === "authority_area"
            ? "विकास प्राधिकरण"
            : "नगर पालिका परिषद";
        const ulbPins = pinsByUlbCode.get(u.code);

        pushPlace({
          id: `lgd-ulb-${u.code}`,
          type: "ward",
          name_en: `${u.nameEn} (${typeLabelEn})`,
          name_hi: `${u.nameHi || u.nameEn} (${typeLabelHi})`,
          ulb_id: lgdType === "nagar_nigam" && comm ? comm.covers?.[0] || dId : matchedEo ? matchedEo.ulbId : defaultUlb,
          tehsil_id: matchedEo ? matchedEo.tehsilId : matchTehsil(u.subdistrict || u.nameEn),
          district_id: dId,
          local_body_type: lgdType,
          ...(ulbPins && ulbPins.size > 0 ? { pincodes: [...ulbPins].slice(0, 4) } : {}),
        });
      }
    }

    // 5. Add non-BO Sub Post Office towns in district
    const seenUrban = new Set<string>();
    for (const po of poList) {
      if (po.isRural) continue;
      const poNorm = normPlace(po.name);
      if (poNorm.length < 3 || seenUrban.has(poNorm)) continue;
      seenUrban.add(poNorm);
      const slug = toSlug(po.name);
      if (!slug) continue;

      const matchedEo = matchEoForToken(poNorm);
      pushPlace({
        id: `town-${dId}-${slug}`,
        type: "ward",
        name_en: `${po.name} (Urban Area / SO)`,
        name_hi: `${po.name} (शहरी क्षेत्र)`,
        ulb_id: matchedEo ? matchedEo.ulbId : defaultUlb,
        tehsil_id: matchedEo ? matchedEo.tehsilId : matchTehsil(poNorm),
        district_id: dId,
        local_body_type: matchedEo ? matchedEo.localBodyType : defaultUlbType,
        pincodes: [po.pin],
      });
    }

    // Compact JSON array (1 entry per line for readability + ~4x smaller download per district)
    const compactBody = "[\n" + places.map((pl) => JSON.stringify(pl)).join(",\n") + "\n]\n";
    fs.writeFileSync(outPath, compactBody, "utf-8");
    filesWritten++;
    totalPlaces += places.length;
  }

  console.log(
    `✅ Generated ${filesWritten} district places files: ${totalPlaces} total entries (${totalVillages} villages/blocks, ${totalWards} urban ULBs/wards). Added ${lgdPinsAdded} new UP PINs from LGD!`
  );
}

run();
