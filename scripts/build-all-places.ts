import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { normalizeUpDistrictSlug } from "../lib/pincode";
import { latinToDevanagari, devanagariToLatin, normalizeDevanagariDigits } from "./lib/transliterate";

const requireCjs = createRequire(path.join(process.cwd(), "package.json"));
const { parquetReadObjects } = requireCjs("hyparquet");
const { compressors } = requireCjs("hyparquet-compressors");

const DATA_DIR = path.join(process.cwd(), "public", "data");
const DISTRICTS_DIR = path.join(DATA_DIR, "districts");
const PLACES_DIR = path.join(DATA_DIR, "places");
const CACHE_DIR = path.join(process.cwd(), ".cache", "lgd");
const INDIA_POST_CACHE = path.join(process.cwd(), ".cache", "india-post", "pincode.csv");
const PILOT_DISTRICTS = new Set(["agra", "jaunpur", "lucknow", "prayagraj", "varanasi"]);

const LGD_META_URL = "https://ramseraph.github.io/opendata/lgd/data/metadata.json";
const INDIA_POST_CSV_URL = "https://raw.githubusercontent.com/dropdevrahul/pincodes-india/master/pincode.csv";

const BLOCK_PHONETIC_ALIASES: Record<string, string[]> = {
  "bakshikatalab": ["bkt", "bakshikatalab", "bakhshikatalab"],
  "bakhshikatalab": ["bkt", "bakshikatalab"],
  "tandiyawan": ["tadiyawan"],
  "madhavganj": ["madhoganj"],
  "behandar": ["behadar"],
  "toderpur": ["tondarpur", "todarpur"],
  "sarbankhera": ["sarvankheda", "sarvankhera"],
  "ikona": ["ikauna", "ikouna"],
  "ikouna": ["ikauna", "ikona"],
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
  "chhanbey": ["chhanvey", "chanvey"],
  "halia": ["hallia", "haliya"],
  "kon": ["kone"],
  "deeh": ["dih", "deegh"],
  "saifai": ["sefai"],
  "bidnu": ["vidhunu"],
  "fatehganjwest": ["fatehganjpaschim"],
  "fatehganjpaschim": ["fatehganjwest"],
  "fatehganjeast": ["fatehganjpurvi"],
  "fatehganjpurvi": ["fatehganjeast"],
  "sohnaon": ["sohanv", "sohaon"],
  "urwa": ["uruwan", "uruwa"],
  "suithakala": ["suithakalan", "suithakala"],
  "karanjakala": ["karanjit"],
  "karanjit": ["karanjakala"],
  "singhashanpur": ["singhpur"],
  "pratappurkamaicha": ["ppkamaicha"],
  "rampursangramgarh": ["rampursanramgarh"],
  "mohammadabadgohna": ["mohammadabadgohana"],
  "doharighat": ["dohrighat"],
  "pandeypur": ["panditdeendayalupadhyay", "panditdeendayalupadhyaynagar", "mughalsarai", "ddu"],
  "khekra": ["khekada"],
  "naujheel": ["nohjhil"],
  "gainsari": ["gaisri"],
  "mausadar": ["maunathbhanjan", "mau"],
  "dhanghata": ["ghanghata"],
  "alapur": ["allapur"],
  "sarojininagar": ["sarojaninagar", "sarojninagar"],
  "gosainganj": ["gosaiganj"],
  "ramnagar": ["ram-nagar"],
  "shuklabazar": ["shukulbazar"],
  "achhalda": ["achchalda"],
  "harringtonganj": ["hariyangatanganj", "haringtonganj"],
  "sathiaon": ["sathiyaon"],
  "koyelsa": ["koilsa"],
  "pawani": ["pawai"],
  "chittaura": ["chitaura"],
  "tajwapur": ["tejwapur"],
  "kaisarganj": ["kaiserganj"],
  "siarchor": ["siar"],
  "maniyar": ["maniar"],
  "dubhad": ["dubhar"],
  "pachperwa": ["pachpedwa"],
  "rehrabazar": ["reherabazaar"],
  "mahua": ["mahuva"],
  "nindoora": ["nindaura"],
  "siraulighauspur": ["sirauligauspur"],
  "dewan": ["dewa"],
  "puredalai": ["pure-dalai"],
  "siddhaur": ["sidhaur"],
  "haidergarh": ["haidargarh"],
  "rudhauli": ["rudauli"],
  "saunghat": ["saughat"],
  "aguta": ["agauta"],
  "lakhaoti": ["lakhaothi"],
  "debai": ["dibai"],
  "chahania": ["chahniya"],
  "niamatabad": ["niyamatabad"],
  "barhani": ["berahani"],
  "chakia": ["chakiya"],
  "tarkulwa": ["tarkalua"],
  "mohammadabad": ["mohamdabad"],
  "teliyani": ["telyani"],
  "deokali": ["devkali"],
  "birno": ["virno"],
  "bhawarkol": ["bhanwarkol"],
  "sahpau": ["sehpau"],
  "mariahu": ["mariyahu"],
  "mogarabadshahpur": ["mungrabadshahpur"],
  "machhlishahr": ["machchalishahar"],
  "guganpur": ["gughrapur"],
  "chaubepur": ["chaubeypur"],
  "sahaver": ["sahawar"],
  "nebuanaurangiya": ["nebuanaurangia"],
  "kaptanganj": ["kaptainganj"],
  "kasia": ["kasaya", "kasya"],
  "dudhai": ["dudhahi"],
  "paliya": ["palia"],
  "bijua": ["bijuwa"],
  "mahroni": ["mehroni"],
  "laxmipur": ["lakshmipur"],
  "brijmanganj": ["bridgemanganj"],
  "paniara": ["paniyara"],
  "bhongaon": ["bhogaon"],
  "mant": ["mat"],
  "goverdhan": ["govardhan"],
  "chunarnarayanpur": ["narainpur", "narayanpur"],
  "chhajlat": ["chhajlet"],
  "laxmanpur": ["lakshamanpur"],
  "kaundhiyara": ["kaudhiyara"],
  "rohaniya": ["rohania"],
  "chamraua": ["chamraon"],
  "baniakhera": ["baniyakhera"],
  "janawai": ["junawai"],
  "satha": ["santha"],
  "unn": ["un"],
  "sirsia": ["sirsiya"],
  "duddhi": ["dudhi"],
  "dubeypur": ["dubepur"],
  "kudwar": ["kurwar"],
  "miyanganj": ["mianganj"],
  "sikandarpursirohi": ["sikandarpursarausi"],
  "ghabhana": ["gabhana"],
  "khutahan": ["khuthan"],
  "allahpur": ["budhanpurseohara", "alhepur", "seohara"],
};

function normPlace(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\bp\.?p\.?\s*/g, "pratappur ")
    .replace(
      /\b(block|vikas|khand|tehsil|tahsil|rural|nagar|palika|parishad|prishad|parishd|panchayat|nigam|town|mb|np|npp|dham)\b/g,
      " "
    )
    .replace(/[^a-z0-9]/g, "")
    .replace(/x/g, "ks")
    .replace(/ksh/g, "ks")
    .replace(/ganv|gaav/g, "gaon")
    .replace(/z/g, "j")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/bh/g, "b")
    .replace(/dh/g, "d")
    .replace(/th/g, "t")
    .replace(/ph/g, "f")
    .replace(/sh/g, "s")
    .replace(/ch+/g, "c")
    .replace(/([a-z])\1+/g, "$1")
    .replace(/v/g, "w")
    .replace(/y/g, "i")
    .replace(/au|ao|ou/g, "o")
    .replace(/ee|ea/g, "i")
    .replace(/oo/g, "u")
    .replace(/aa/g, "a");
}

function skeleton(s: string): string {
  return normPlace(s)
    .replace(/[aeiou]/g, "")
    .replace(/n(?=[bcdfgjklmnpqrstvwxz])/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function toSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(s: string): string {
  return (s || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeEnglish(s: string): string {
  const clean = normalizeDevanagariDigits(s || "");
  if (!/[\u0900-\u097f]/.test(clean)) return clean.trim();
  return devanagariToLatin(clean).replace(/[\u0900-\u097f]/g, "").replace(/\s+/g, " ").trim();
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
    if (!url) {
      console.warn(`⚠️ Missing LGD URL & local cache for ${datasetName}`);
      return [];
    }
    console.log(`⬇️  Downloading LGD ${datasetName}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed LGD ${datasetName}: HTTP ${res.status}`);
    ab = await res.arrayBuffer();
    fs.writeFileSync(cachePath, Buffer.from(ab));
  }
  return parquetReadObjects({ file: ab, compressors });
}

async function ensureIndiaPostCsv(): Promise<string | null> {
  if (fs.existsSync(INDIA_POST_CACHE)) return INDIA_POST_CACHE;
  try {
    console.log("⬇️  Downloading official India Post pincode.csv into .cache/india-post/...");
    const res = await fetch(INDIA_POST_CSV_URL, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const text = await res.text();
    fs.mkdirSync(path.dirname(INDIA_POST_CACHE), { recursive: true });
    fs.writeFileSync(INDIA_POST_CACHE, text, "utf-8");
    return INDIA_POST_CACHE;
  } catch {
    return null;
  }
}

async function run() {
  if (!fs.existsSync(PLACES_DIR)) fs.mkdirSync(PLACES_DIR, { recursive: true });
  const districts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "districts.json"), "utf8"));
  const validDistSet = new Set<string>(districts.map((d: any) => d.id));

  // 1. Load official India Post CSV from .cache/india-post/pincode.csv
  const csvPath = await ensureIndiaPostCsv();
  const poByDistrict = new Map<string, { name: string; pin: string; isRural: boolean }[]>();
  if (csvPath && fs.existsSync(csvPath)) {
    const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/);
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

  // 2. Load Official LGD State 09 (Uttar Pradesh) datasets (from .cache/lgd or live metadata)
  let meta: any = null;
  try {
    meta = await (await fetch(LGD_META_URL, { signal: AbortSignal.timeout(8000) })).json();
  } catch {
    console.warn("⚠️ Could not fetch LGD metadata, using local .cache/lgd files...");
  }

  const vbbRows = (await loadLgdParquet(meta, "villages_by_blocks")).filter((r: any) => String(r.state_code) === "9");
  const villRows = (await loadLgdParquet(meta, "villages")).filter((r: any) => String(r.state_code) === "9");
  const pinVillRows = (await loadLgdParquet(meta, "pincode_villages")).filter((r: any) => String(r.state_code) === "9");
  const ulbRows = (await loadLgdParquet(meta, "urban_local_bodies")).filter((r: any) => String(r.state_code) === "9");
  const ulbCovRows = (await loadLgdParquet(meta, "statewise_ulbs_coverage")).filter((r: any) =>
    /uttar pradesh/i.test(r.state_name || "")
  );
  const pinUrbanRows = (await loadLgdParquet(meta, "pincode_urban")).filter((r: any) => String(r.state_code) === "9");

  // Build village_code -> Hindi name and verified PINs
  const hiVillageByCode = new Map<string, string>();
  for (const r of villRows) {
    const code = String(r.village_code || "");
    const local = String(r.village_name_local || "").trim();
    if (code && local && /[\u0900-\u097f]/.test(local)) {
      hiVillageByCode.set(code, normalizeDevanagariDigits(local));
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
        nameHi: /[\u0900-\u097f]/.test(localName) ? normalizeDevanagariDigits(localName) : "",
        typeCode: String(ulbMeta.local_body_type_code || "5"),
        subdistrict: subName,
      });
    }
  }

  // Enrich pincodes.json cleanly with any missing valid UP PINs from LGD
  const pincodesPath = path.join(DATA_DIR, "pincodes.json");
  const pincodesMap: Record<string, Array<{ district_id: string; tehsil_id?: string; locality_en?: string }>> =
    fs.existsSync(pincodesPath) ? JSON.parse(fs.readFileSync(pincodesPath, "utf8")) : {};
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

    const sdms = offices.filter((o) => o.role === "sdm");
    const tehsils = sdms.map((o) => o.covers?.[0]).filter(Boolean);
    const tehsilMetaById = new Map<string, { en: string; hi: string }>();
    for (const sdm of sdms) {
      const id = sdm.covers?.[0];
      if (!id) continue;
      const en =
        (sdm.office_name_en || "")
          .replace(/^Sub-Divisional Magistrate \(SDM\),?\s*Tehsil\s*/i, "")
          .trim() || toTitleCase(id);
      const hi =
        (sdm.office_name_hi || "")
          .replace(/^उपजिलाधिकारी\s*\(एसडीएम\)\s*[,:\-–]?\s*तहसील\s*/u, "")
          .trim() || latinToDevanagari(en);
      tehsilMetaById.set(id, { en: sanitizeEnglish(en), hi });
    }

    const tehsilNorms = tehsils.map((t: string) => {
      const n = normPlace(t);
      const sk = skeleton(t);
      const aliases = [n, ...(BLOCK_PHONETIC_ALIASES[t.replace(/-/g, "")] || []).map(normPlace)];
      return { id: t, norm: n, sk, aliases };
    });
    const defaultTehsil = tehsils.find((t: string) => t.includes("sadar")) || tehsils[0] || "sadar";

    const matchTehsil = (raw: string, allowFallback = true): string => {
      const cleanRaw = (raw || "").trim();
      const n = normPlace(cleanRaw);
      if (!n || n.length < 2) return defaultTehsil;
      // District HQ -> Sadar mapping (or reverse: Bastisadar <-> Basti)
      const distNorm = normPlace(d.name_en);
      const isDistSadar =
        n === distNorm ||
        n === normPlace(dId) ||
        (dId === "ayodhya" && n === "faizabad") ||
        (dId === "prayagraj" && n === "allahabad") ||
        (dId === "mau" && n === "maunatbanjan");
      if (isDistSadar) {
        const sadarId = tehsils.find((t: string) => t === "sadar" || t.endsWith("-sadar"));
        if (sadarId) return sadarId;
      }
      if (n.endsWith("sadar")) {
        const stem = n.slice(0, -5);
        const directMatch = tehsilNorms.find((t) => t.norm === stem);
        if (directMatch) return directMatch.id;
      } else {
        const withSadar = tehsilNorms.find((t) => t.norm === `${n}sadar`);
        if (withSadar) return withSadar.id;
      }

      const candNorms = [n, ...(BLOCK_PHONETIC_ALIASES[cleanRaw.toLowerCase().replace(/[^a-z0-9]/g, "")] || []).map(normPlace)];
      for (const cand of candNorms) {
        const exact = tehsilNorms.find((t) => t.aliases.includes(cand));
        if (exact) return exact.id;
      }
      const substr = tehsilNorms.find((t) => t.norm.length >= 4 && (n.includes(t.norm) || t.norm.includes(n)));
      if (substr) return substr.id;

      const sk = skeleton(cleanRaw);
      if (sk.length >= 3) {
        const skMatch = tehsilNorms.find((t) => t.sk === sk);
        if (skMatch) return skMatch.id;
      }
      if (n.length >= 5) {
        const lev1 = tehsilNorms.find((t) => levenshtein(t.norm, n) <= 1);
        if (lev1) return lev1.id;
      }
      if (n.length >= 7) {
        const lev2 = tehsilNorms.find((t) => t.norm[0] === n[0] && levenshtein(t.norm, n) <= 2);
        if (lev2) return lev2.id;
      }
      return allowFallback ? defaultTehsil : toSlug(cleanRaw) || defaultTehsil;
    };

    const bdos = offices.filter((o) => o.role === "bdo");
    const eos = offices.filter((o) => o.role === "eo");
    const comm = offices.find((o) => o.role === "commissioner");

    const blockMetaById = new Map<string, { en: string; hi: string }>();
    for (const b of bdos) {
      const id = b.covers?.[0];
      if (!id) continue;
      const en =
        (b.office_name_en || "")
          .replace(/^Block Development Officer,?\s*(?:Block\s*)?/i, "")
          .trim() || toTitleCase(id);
      const hi =
        (b.office_name_hi || "")
          .replace(/^खंड विकास अधिकारी,?\s*(?:विकास खंड|ब्लॉक)?\s*/u, "")
          .replace(/^खण्ड विकास अधिकारी,?\s*(?:विकास खंड|ब्लॉक)?\s*/u, "")
          .trim() || latinToDevanagari(en);
      blockMetaById.set(id, { en: sanitizeEnglish(en), hi });
    }

    const bdoNorms = bdos.map((b) => {
      const id = (b.covers?.[0] as string) || "";
      const n = normPlace(id);
      const cleanKey = id.replace(/-/g, "");
      const officeStem = normPlace((b.office_name_en || "").replace(/^Block Development Officer,?\s*/i, ""));
      const aliases = [...new Set([n, officeStem, ...(BLOCK_PHONETIC_ALIASES[cleanKey] || []).map(normPlace)])].filter(
        (x) => x.length >= 2
      );
      const sk = skeleton(id);
      return { id, norm: n, sk, aliases };
    });

    const matchBlock = (rawBlock: string, allowFallback = true): string => {
      const cleanRaw = (rawBlock || "").trim();
      const n = normPlace(cleanRaw);
      if (!n) return bdos[0]?.covers?.[0] || toSlug(cleanRaw);
      const rawKey = cleanRaw.toLowerCase().replace(/[^a-z0-9]/g, "");
      const candSet = [...new Set([n, ...(BLOCK_PHONETIC_ALIASES[rawKey] || []).map(normPlace)])];
      for (const cand of candSet) {
        const exact = bdoNorms.find((b) => b.aliases.includes(cand));
        if (exact) return exact.id;
        if (!cand.endsWith("sadar")) {
          const withSadar = bdoNorms.find((b) => b.aliases.includes(`${cand}sadar`));
          if (withSadar) return withSadar.id;
        }
      }
      const substr = bdoNorms.find((b) =>
        b.aliases.some((a) => a.length >= 4 && (n.includes(a) || a.includes(n)))
      );
      if (substr) return substr.id;

      const sk = skeleton(cleanRaw);
      if (sk.length >= 3) {
        const skMatch = bdoNorms.find((b) => b.sk === sk);
        if (skMatch) return skMatch.id;
      }
      if (n.length >= 5) {
        const lev1 = bdoNorms.find((b) => levenshtein(b.norm, n) <= 1);
        if (lev1) return lev1.id;
      }
      if (n.length >= 7) {
        const lev2 = bdoNorms.find((b) => b.norm[0] === n[0] && levenshtein(b.norm, n) <= 2);
        if (lev2) return lev2.id;
      }
      return allowFallback ? bdos[0]?.covers?.[0] || toSlug(cleanRaw) : toSlug(cleanRaw);
    };

    const getBlockLabels = (blockId: string, rawHint?: string): { en: string; hi: string } => {
      const known = blockMetaById.get(blockId);
      if (known) return known;
      const en = sanitizeEnglish(rawHint || toTitleCase(blockId));
      return { en, hi: latinToDevanagari(en) };
    };

    const getTehsilLabels = (tehsilId: string, rawHint?: string): { en: string; hi: string } => {
      const known = tehsilMetaById.get(tehsilId);
      if (known) return known;
      const en = sanitizeEnglish(rawHint || toTitleCase(tehsilId));
      return { en, hi: latinToDevanagari(en) };
    };

    const places: any[] = [];
    const seenIds = new Set<string>();
    const seenVillageKeys = new Set<string>();

    const pushPlace = (pl: any) => {
      if (seenIds.has(pl.id)) return;
      seenIds.add(pl.id);
      places.push(pl);
      if (pl.type === "village") totalVillages++;
      else totalWards++;
    };

    // Keep verified non-synthetic legacy entries (w- / cantt-) only; never synthetic v-* placeholders
    const outPath = path.join(PLACES_DIR, `${dId}.json`);
    if (PILOT_DISTRICTS.has(dId) && fs.existsSync(outPath)) {
      const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
      for (const pl of existing) {
        if (/^(?:w-|cantt-)/.test(pl.id)) {
          pushPlace(pl);
        }
      }
    }

    // 1. Add every Development Block (Direct Block/BDO Entry)
    for (const bdo of bdos) {
      const blockId = bdo.covers?.[0];
      if (!blockId) continue;
      const bLabels = getBlockLabels(blockId);
      const matchingTehsil = matchTehsil(blockId);
      const tLabels = getTehsilLabels(matchingTehsil);

      pushPlace({
        id: `block-${dId}-${blockId}`,
        type: "village",
        name_en: `${bLabels.en} (Full Block / All Gram Panchayats)`,
        name_hi: `${bLabels.hi} (पूरा विकास खंड / सभी ग्राम पंचायतें)`,
        gp_id: `gp-${blockId}`,
        block_id: blockId,
        block_name_en: bLabels.en,
        block_name_hi: bLabels.hi,
        tehsil_id: matchingTehsil,
        tehsil_name_en: tLabels.en,
        tehsil_name_hi: tLabels.hi,
        district_id: dId,
        local_body_type: "gram_panchayat",
      });
    }

    // 2. Add Official LGD Census Villages & Gram Panchayats for this district
    const pinBlockVotes = new Map<string, Map<string, number>>();
    const pinTehsilVotes = new Map<string, Map<string, number>>();

    const lgdVillages = lgdVillagesByDistrict.get(dId) || [];
    for (const rv of lgdVillages) {
      const vCode = String(rv.village_code || "").trim();
      const vName = sanitizeEnglish(String(rv.village_name || "").trim());
      const gpName = sanitizeEnglish(String(rv.local_body_name || "").trim());
      const blkName = String(rv.block_name || "").trim();
      const subName = String(rv.subdistrict_name || "").trim();
      if (!vCode || !vName) continue;

      const matchedBlock = matchBlock(blkName, false);
      const matchedTehsil = matchTehsil(subName || blkName, true);
      const bLabels = getBlockLabels(matchedBlock, blkName);
      const tLabels = getTehsilLabels(matchedTehsil, subName);

      const gpSlug = toSlug(gpName || matchedBlock) || matchedBlock;
      const rawHi = hiVillageByCode.get(vCode);
      const hiBase = rawHi
        ? /[A-Za-z]/.test(rawHi)
          ? latinToDevanagari(rawHi)
          : rawHi
        : latinToDevanagari(vName);
      const gpHi = gpName ? latinToDevanagari(gpName) : "";
      const pins = pinsByVillageCode.get(vCode);
      const pinList = pins && pins.size > 0 ? [...pins].slice(0, 4) : [];

      for (const pin of pinList) {
        if (!pinBlockVotes.has(pin)) pinBlockVotes.set(pin, new Map());
        const bm = pinBlockVotes.get(pin)!;
        bm.set(matchedBlock, (bm.get(matchedBlock) || 0) + 1);

        if (!pinTehsilVotes.has(pin)) pinTehsilVotes.set(pin, new Map());
        const tm = pinTehsilVotes.get(pin)!;
        tm.set(matchedTehsil, (tm.get(matchedTehsil) || 0) + 1);
      }

      const gpSuffixEn = gpName && normPlace(gpName) !== normPlace(vName) ? ` (GP: ${gpName})` : ` (GP)`;
      const gpSuffixHi =
        gpName && normPlace(gpName) !== normPlace(vName) ? ` (ग्रा.पं.: ${gpHi})` : ` (ग्राम पंचायत)`;

      seenVillageKeys.add(`${normPlace(vName)}::${matchedBlock}`);
      seenVillageKeys.add(normPlace(vName));

      pushPlace({
        id: `lgd-${vCode}`,
        type: "village",
        name_en: `${vName}${gpSuffixEn}`,
        name_hi: `${hiBase}${gpSuffixHi}`,
        gp_id: `gp-${gpSlug}`,
        block_id: matchedBlock,
        block_name_en: bLabels.en,
        block_name_hi: bLabels.hi,
        tehsil_id: matchedTehsil,
        tehsil_name_en: tLabels.en,
        tehsil_name_hi: tLabels.hi,
        district_id: dId,
        local_body_type: "gram_panchayat",
        ...(pinList.length > 0 ? { pincodes: pinList } : {}),
      });
    }

    const pickTopVote = (votes: Map<string, Map<string, number>>, pin: string): string | undefined => {
      const m = votes.get(pin);
      if (!m || m.size === 0) return undefined;
      let bestId: string | undefined;
      let bestCount = -1;
      for (const [id, c] of m.entries()) {
        if (c > bestCount) {
          bestCount = c;
          bestId = id;
        }
      }
      return bestId;
    };

    // 3. Add India Post Branch Post Office (BO) villages not already covered by LGD
    //    Use PIN co-occurrence with LGD villages + pincodes.json block hints before falling back!
    const poList = poByDistrict.get(dId) || [];
    const blockNames = bdos.map((b) => ({
      id: b.covers?.[0] as string,
      norm: normPlace(b.covers?.[0] || ""),
    }));
    const seenRuralNames = new Set<string>();
    for (const po of poList) {
      if (!po.isRural) continue;
      const poClean = sanitizeEnglish(po.name);
      const poNorm = normPlace(poClean);
      if (poNorm.length < 3 || seenRuralNames.has(poNorm) || seenVillageKeys.has(poNorm)) continue;
      seenRuralNames.add(poNorm);

      let matchedBlock =
        blockNames.find((b) => b.norm.length >= 4 && (poNorm.includes(b.norm) || b.norm.includes(poNorm)))?.id ||
        pickTopVote(pinBlockVotes, po.pin);

      if (!matchedBlock) {
        const pinEntries = pincodesMap[po.pin] || [];
        const sameDistEntry = pinEntries.find((e) => e.district_id === dId);
        const blockHintMatch = sameDistEntry?.locality_en?.match(/Block:\s*([^|·]+)/i);
        if (blockHintMatch) {
          const firstBlockHint = blockHintMatch[1].split(",")[0].trim();
          const candidate = matchBlock(firstBlockHint, false);
          if (blockMetaById.has(candidate)) matchedBlock = candidate;
        } else if (sameDistEntry?.tehsil_id) {
          const candidate = matchBlock(sameDistEntry.tehsil_id, false);
          if (blockMetaById.has(candidate)) matchedBlock = candidate;
        }
      }
      if (!matchedBlock) matchedBlock = blockNames[0]?.id;
      if (!matchedBlock) continue;

      const matchingTehsil = pickTopVote(pinTehsilVotes, po.pin) || matchTehsil(poClean, true);
      const bLabels = getBlockLabels(matchedBlock);
      const tLabels = getTehsilLabels(matchingTehsil);
      const slug = toSlug(poClean);
      if (!slug) continue;

      pushPlace({
        id: `po-${dId}-${slug}`,
        type: "village",
        name_en: `${poClean} (Post / GP Area)`,
        name_hi: `${latinToDevanagari(poClean)} (डाक / ग्राम पंचायत क्षेत्र)`,
        gp_id: `gp-${matchedBlock}`,
        block_id: matchedBlock,
        block_name_en: bLabels.en,
        block_name_hi: bLabels.hi,
        tehsil_id: matchingTehsil,
        tehsil_name_en: tLabels.en,
        tehsil_name_hi: tLabels.hi,
        district_id: dId,
        local_body_type: "gram_panchayat",
        pincodes: [po.pin],
      });
    }

    // 4. Add Municipal Corporation / Harvested ULB EOs / LGD ULBs
    if (comm) {
      const defTLabels = getTehsilLabels(defaultTehsil);
      pushPlace({
        id: `ward-${dId}-nigam`,
        type: "ward",
        name_en: `${d.name_en} Municipal Corporation (All Wards)`,
        name_hi: `${d.name_hi} नगर निगम (सभी वार्ड)`,
        ulb_id: comm.covers?.[0] || dId,
        tehsil_id: defaultTehsil,
        tehsil_name_en: defTLabels.en,
        tehsil_name_hi: defTLabels.hi,
        district_id: dId,
        local_body_type: "nagar_nigam",
      });
    }

    const eoMatchers: Array<{
      ulbId: string;
      tehsilId: string;
      localBodyType: "nagar_panchayat" | "nagar_palika_parishad" | "authority_area";
      isMain: boolean;
      tokens: string[];
    }> = [];

    for (const eo of eos) {
      const ulbId: string = eo.covers?.[0] || `ulb-${dId}-main`;
      const isMain = eo.id.endsWith("-main");
      const rawName = sanitizeEnglish((eo.office_name_en || "").replace(/^Executive Officer,\s*/i, "").trim()) || `${d.name_en} ULB`;
      const rawNameHi = (eo.office_name_hi || "").replace(/^अधिशासी अधिकारी\s*[,:\-–]?\s*/u, "").trim();
      const isAuthority = /authority|pradhikaran/i.test(`${rawName} ${ulbId}`);
      const isNp = /nagar\s*panchayat|नगर\s*पंचायत/i.test(`${rawName} ${rawNameHi}`);
      const localBodyType: "nagar_panchayat" | "nagar_palika_parishad" | "authority_area" = isAuthority
        ? "authority_area"
        : isNp
        ? "nagar_panchayat"
        : "nagar_palika_parishad";

      const cleanTownNorm = normPlace(rawName);
      const ulbSlugNorm = normPlace(ulbId.replace(/^ulb-/, "").replace(/-main$/, ""));
      const tehsilId = matchTehsil(ulbSlugNorm) !== defaultTehsil ? matchTehsil(ulbSlugNorm) : matchTehsil(cleanTownNorm);
      const tLabels = getTehsilLabels(tehsilId);

      pushPlace({
        id: `ward-${dId}-${ulbId}`,
        type: "ward",
        name_en: `${rawName} (All Wards)`,
        name_hi: rawNameHi ? `${rawNameHi} (सभी वार्ड)` : `${d.name_hi} नगरीय निकाय (सभी वार्ड)`,
        ulb_id: ulbId,
        tehsil_id: tehsilId,
        tehsil_name_en: tLabels.en,
        tehsil_name_hi: tLabels.hi,
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

    const AUTHORITY_ULB_OVERRIDES: Record<string, string> = {
      noida: "ulb-new-okhla-industrial-development-authority",
      gnida: "ulb-greater-noida-industrial-development-authority",
      yeida: "ulb-yamuna-expressway-industrial-development-authority",
    };

    const matchEoForToken = (tokenNorm: string) => {
      const directOverrideId = AUTHORITY_ULB_OVERRIDES[tokenNorm];
      if (directOverrideId) {
        const direct = orderedEoMatchers.find((m) => m.ulbId === directOverrideId);
        if (direct) return direct;
      }
      return (
        orderedEoMatchers.find((m) => m.tokens.some((tok) => tok === tokenNorm)) ||
        orderedEoMatchers.find((m) =>
          m.tokens.some(
            (tok) =>
              tok.length >= 4 &&
              !(tokenNorm === "noida" && tok.includes("greater")) &&
              (tokenNorm.includes(tok) || tok.includes(tokenNorm))
          )
        )
      );
    };

    // 4b. Append all official LGD ULBs in district
    const defaultUlb = eos[0]?.covers?.[0] || comm?.covers?.[0] || `ulb-${dId}-main`;
    const defaultUlbType = comm ? "nagar_nigam" : "nagar_palika_parishad";
    const districtUlbs = lgdUlbsByDistrict.get(dId);
    if (districtUlbs) {
      for (const u of districtUlbs.values()) {
        const cleanEn = sanitizeEnglish(u.nameEn);
        const uNorm = normPlace(cleanEn);
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
        const resolvedTehsil = matchedEo ? matchedEo.tehsilId : matchTehsil(u.subdistrict || cleanEn);
        const tLabels = getTehsilLabels(resolvedTehsil, u.subdistrict);
        const hiLabel = u.nameHi || latinToDevanagari(cleanEn);

        pushPlace({
          id: `lgd-ulb-${u.code}`,
          type: "ward",
          name_en: `${cleanEn} (${typeLabelEn})`,
          name_hi: `${hiLabel} (${typeLabelHi})`,
          ulb_id:
            lgdType === "nagar_nigam" && comm
              ? comm.covers?.[0] || dId
              : matchedEo
              ? matchedEo.ulbId
              : AUTHORITY_ULB_OVERRIDES[uNorm] || defaultUlb,
          tehsil_id: resolvedTehsil,
          tehsil_name_en: tLabels.en,
          tehsil_name_hi: tLabels.hi,
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
      const poClean = sanitizeEnglish(po.name);
      const poNorm = normPlace(poClean);
      if (poNorm.length < 3 || seenUrban.has(poNorm)) continue;
      seenUrban.add(poNorm);
      const slug = toSlug(poClean);
      if (!slug) continue;

      const matchedEo = matchEoForToken(poNorm);
      const resolvedTehsil =
        matchedEo?.tehsilId || pickTopVote(pinTehsilVotes, po.pin) || matchTehsil(poClean);
      const tLabels = getTehsilLabels(resolvedTehsil);
      const resolvedType = matchedEo
        ? matchedEo.localBodyType === "authority_area"
          ? "authority_area"
          : matchedEo.localBodyType
        : defaultUlbType;

      pushPlace({
        id: `town-${dId}-${slug}`,
        type: "ward",
        name_en: `${poClean} (Urban Area / SO)`,
        name_hi: `${latinToDevanagari(poClean)} (शहरी क्षेत्र)`,
        ulb_id: matchedEo ? matchedEo.ulbId : defaultUlb,
        tehsil_id: resolvedTehsil,
        tehsil_name_en: tLabels.en,
        tehsil_name_hi: tLabels.hi,
        district_id: dId,
        local_body_type: resolvedType,
        pincodes: [po.pin],
      });
    }

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
