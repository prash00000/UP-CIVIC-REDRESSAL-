import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { phoneRegex } from "../lib/validate";
import { parsePdfDirectoryText } from "./lib/pdf-directory";
import { devanagariToLatin, latinToDevanagari, normalizeDevanagariDigits } from "./lib/transliterate";

const requireCjs = createRequire(path.join(process.cwd(), "package.json"));
const pdfParse: (
  buf: Buffer,
  opts?: { max?: number }
) => Promise<{ text: string; numpages: number }> = requireCjs("pdf-parse");

const DATA_DIR = path.join(process.cwd(), "public", "data");
const TODAY = "2026-11-25";

interface ParsedRow {
  url: string;
  name: string;
  designation: string;
  email: string;
  address: string;
  phones: string[];
  rawText: string;
}

const MANUAL_URL_MAP: Record<string, string> = {
  "ambedkar-nagar": "https://ambedkarnagar.nic.in",
  "baghpat": "https://bagpat.nic.in",
  "bhadohi": "https://bhadohi.nic.in",
  "bulandshahr": "https://bulandshahar.nic.in",
  "gautam-buddha-nagar": "https://gbnagar.nic.in",
  "kanpur-dehat": "https://kanpurdehat.nic.in",
  "kanpur-nagar": "https://kanpurnagar.nic.in",
  "kasganj": "https://kasganj.nic.in",
  "kushinagar": "https://kushinagar.nic.in",
  "lakhimpur-kheri": "https://kheri.nic.in",
  "maharajganj": "https://maharajganj.nic.in",
  "prayagraj": "https://prayagraj.nic.in",
  "raebareli": "https://raebareli.nic.in",
  "sant-kabir-nagar": "https://sknagar.nic.in",
  "shravasti": "https://shravasti.nic.in",
  "siddharthnagar": "https://siddharthnagar.nic.in",
};

function decodeHtml(str: string): string {
  return (str || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:p|div|li|td|th|tr|span|a|h[1-6])>/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .replace(/&#8211;|&ndash;|&#8212;|&mdash;/gi, "-")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const VALID_EMAIL_RE =
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.(?:gov\.in|nic\.in|ac\.in|co\.in|res\.in|ernet\.in|org\.in|com|org|net|in|edu)$/i;

const SYNTHETIC_GMAIL_RE = /^(?:bdo|sdm)\.[a-z0-9-]+\.[a-z0-9-]+@gmail\.com$/i;

function cleanEmailLocalPart(email: string): string {
  // Strip glued phone numbers or word+10-digit phone prefixes (e.g., "8189077822nnlko@up.nic.in" or "masodha9454465335bdo.msd@gmail.com")
  return email.replace(/^(?:[a-z-]{0,20})?(?:0\d{9,10}|[6-9]\d{9})(?=[a-z])/i, "");
}

function normalizeEmail(raw: string): string {
  const separated = (raw || "")
    .replace(/(\d{6,})([a-zA-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d{6,})/g, "$1 $2");
  const cleaned = separated
    .replace(/\be-?mail\s*[:\-]\s*/gi, " ")
    .replace(/\s*[\[\(\{\]]\s*at\s*[\]\)\}\[]\s*/gi, "@")
    .replace(/\s*[\[\(\{\]]\s*dot\s*[\]\)\}\[]\s*/gi, ".")
    .replace(/\s*[\[\(\{\]]\s*(?:hyphen|dash)\s*[\]\)\}\[]\s*/gi, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const candidates = (cleaned.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.(?:gov\.in|nic\.in|ac\.in|co\.in|res\.in|ernet\.in|org\.in|com|org|net|in|edu)(?=\s|$|[,;|)<"'\]])/g
  ) || [])
    .map(cleanEmailLocalPart)
    .filter((e) => VALID_EMAIL_RE.test(e) && !SYNTHETIC_GMAIL_RE.test(e));
  if (candidates.length === 0) return "";
  return candidates.find((e) => /\.(?:nic|gov)\.in$/.test(e)) || candidates[0];
}

const UP_4DIGIT_STDS = new Set([
  "0120", "0121", "0122", "0131", "0132",
  "0510", "0512", "0522", "0532", "0535",
  "0542", "0547", "0548", "0551", "0562",
  "0565", "0571", "0581", "0591", "0595",
]);

function splitStdNumber(rawDigits: string): string | null {
  if (!/^0\d{9,10}$/.test(rawDigits)) return null;
  const p4 = rawDigits.slice(0, 4);
  if (UP_4DIGIT_STDS.has(p4)) {
    const rest = rawDigits.slice(4);
    if (/^\d{6,8}$/.test(rest)) return `${p4}-${rest}`;
  }
  const p5 = rawDigits.slice(0, 5);
  const rest5 = rawDigits.slice(5);
  if (/^\d{6,7}$/.test(rest5)) return `${p5}-${rest5}`;
  return null;
}

function extractPhones(raw: string, stdHint?: string): string[] {
  const results = new Set<string>();
  const clean = normalizeDevanagariDigits(raw || "")
    .replace(/&#8211;|&ndash;|&mdash;/g, "-")
    .replace(/([a-zA-Z\u0900-\u097f])(\d{6,})/g, "$1 $2");

  // 10-digit mobiles starting 6-9 (compact or grouped like "6390 084 784" or "94544 65275")
  for (const m of clean.matchAll(/(?:\+?91[\s-]*)?\b0?([6-9]\d{9})\b/g)) {
    results.add(m[1]);
  }
  for (const m of clean.matchAll(/(?:\+?91[\s-]*)?\b0?([6-9]\d{2,4}[\s-]\d{3,4}(?:[\s-]\d{3,4})?)\b/g)) {
    const compact = m[1].replace(/[\s-]+/g, "");
    if (/^[6-9]\d{9}$/.test(compact)) results.add(compact);
  }
  // Explicit STD-landline e.g. 0522-2623024 or 0522 2623024 (re-split safely for 4-digit UP STDs)
  for (const m of clean.matchAll(/\b(0\d{2,4})[\s-]+(\d{6,8})\b/g)) {
    const digits = `${m[1]}${m[2]}`;
    const fixed = splitStdNumber(digits) || `${m[1]}-${m[2]}`;
    if (phoneRegex.test(fixed)) results.add(fixed);
  }
  // Unhyphenated 10-11 digit STD starting 0 (check 4-digit UP STDs BEFORE 5-digit STDs)
  for (const m of clean.matchAll(/\b(0\d{9,10})\b/g)) {
    const formatted = splitStdNumber(m[1]);
    if (formatted && phoneRegex.test(formatted)) results.add(formatted);
  }
  // Noida/Ghaziabad 10-digit STD omitted leading 0 (e.g. "Phone : 1202395153")
  for (const m of clean.matchAll(/(?:phone|tel|contact|ph|fax)\s*[:\-]?\s*(120)(\d{7})\b/gi)) {
    const formatted = `0${m[1]}-${m[2]}`;
    if (phoneRegex.test(formatted)) results.add(formatted);
  }
  // Standalone 6-8 digit local number ONLY when STD header is known (avoid matching PINs starting 20-28 when 6 digits)
  if (stdHint && /^0\d{2,4}$/.test(stdHint)) {
    for (const m of clean.matchAll(/\b(\d{7,8})\b/g)) {
      const formatted = `${stdHint}-${m[1]}`;
      if (phoneRegex.test(formatted)) results.add(formatted);
    }
  }
  return [...results];
}

function isCleanName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 70) return false;
  if (/^(vacant|na|n\/a|-+|nil|none|tbd|blank|s\.?no\.?|sl\.?)$/i.test(name.trim())) return false;
  if (/^\d+$/.test(name.trim())) return false;
  if (/@|http|tel:|fax|std/i.test(name)) return false;
  return true;
}

const HQ_TOWN_ALIASES: Record<string, string[]> = {
  "ambedkar-nagar": ["akbarpur"],
  "amethi": ["gauriganj", "amethi"],
  "bhadohi": ["gyanpur", "bhadohi"],
  "chitrakoot": ["karwi", "chitrakoot"],
  "farrukhabad": ["fatehgarh", "farrukhabad"],
  "gautam-buddha-nagar": ["dadri", "jewar", "dankaur", "noida"],
  "jalaun": ["orai", "jalaun"],
  "kanpur-dehat": ["akbarpur", "pukhrayan", "rura"],
  "kaushambi": ["manjhanpur", "bharwari"],
  "kushinagar": ["padrauna", "kushinagar"],
  "lakhimpur-kheri": ["lakhimpur", "kheri"],
  "maharajganj": ["maharajganj", "nautanwa"],
  "sant-kabir-nagar": ["khalilabad"],
  "shravasti": ["bhinga"],
  "siddharthnagar": ["naugarh", "tetari", "siddharthnagar"],
  "sonbhadra": ["robertsganj"],
};

const BLOCK_ALIASES: Record<string, string[]> = {
  "bakshi-ka-talab": ["bkt", "bakhshikatalab"],
  "mal": ["mall"],
  "sarojini-nagar": ["sarojininagar", "sarojninagar", "sarojani-nagar"],
  "gosainganj": ["gosaiganj"],
  "aliya": ["ailiya", "ailya", "aeli"],
  "madhogarh": ["nmadhogarh"],
  "kashi-vidya-pith": ["kashividyapith", "vidyapith", "kashividyapeeth"],
  "pindra": ["pindara"],
  "hariharpur-rani": ["hariharpurrani", "hariharpur"],
  "machhrehta": ["machharehata", "machhrehata"],
  "mahmudabad": ["mahmoodabad"],
  "sidhauli": ["sidhaouli", "sidholi"],
  "kasmanda": ["kasmnda"],
  "bhatpar-rani": ["bhatpar"],
  "araziline": ["arajiline", "araji-line"],
  "deoria-sadar": ["deoriasadar", "deoria"],
  "tandiyawan": ["tadiyawan"],
  "madhavganj": ["madhoganj"],
  "behandar": ["behadar"],
  "toderpur": ["tondarpur", "todarpur"],
  "sarbankhera": ["sarvankheda", "sarvankhera"],
  "ikouna": ["ikauna", "ikona"],
  "chhanbey": ["chhanvey", "chanvey"],
  "halia": ["hallia", "haliya"],
  "kon": ["kone"],
  "majhawan": ["majhwa", "majhawa"],
  "lalganj": ["laalganj"],
  "deeh": ["dih", "deegh"],
  "saifai": ["sefai"],
  "bidnu": ["vidhunu"],
  "fatehganj-paschim": ["fatehganjwest", "fatehganj west"],
  "fatehganj-purvi": ["fatehganjeast", "fatehganj east"],
  "sohnaon": ["sohanv", "sohaon"],
  "urwa": ["uruwan", "uruwa"],
  "suitha-kala": ["suithakalan", "suithakala"],
  "karanja-kala": ["karanjakala", "karanjit"],
  "karanjit": ["karanjakala"],
  "singhashanpur": ["singhpur"],
  "pratappur-kamaicha": ["ppkamaicha"],
  "rampur-sangramgarh": ["rampursanramgarh"],
  "mohammadabad-gohna": ["mohammadabadgohana"],
  "doharighat": ["dohrighat"],
  "pandeypur": ["panditdeendayalupadhyay", "panditdeendayalupadhyaynagar", "mughalsarai", "ddu", "ptdeendayalupadhyaynagar"],
  "khekra": ["khekada"],
  "naujheel": ["nohjhil"],
  "gainsari": ["gaisri"],
  "mau-sadar": ["maunathbhanjan", "mau"],
  "dhanghata": ["ghanghata"],
  "alapur": ["allapur"],
  "ramnagar": ["ram-nagar"],
  "shukla-bazar": ["shukul-bazar"],
  "achhalda": ["achchalda"],
  "harringtonganj": ["hariyangatanganj", "haringtonganj"],
  "sathiaon": ["sathiyaon"],
  "koyelsa": ["koilsa"],
  "pawani": ["pawai"],
  "chittaura": ["chitaura"],
  "tajwapur": ["tejwapur"],
  "nawabganj": ["bawabganj"],
  "kaisarganj": ["kaiserganj"],
  "siarchor": ["siar"],
  "maniyar": ["maniar"],
  "dubhad": ["dubhar"],
  "pachperwa": ["pachpedwa"],
  "rehra-bazar": ["rehera-bazaar"],
  "mahua": ["mahuva"],
  "nindoora": ["nindaura"],
  "sirauli-ghauspur": ["sirauli-gauspur"],
  "dewan": ["dewa"],
  "pure-dalai": ["puredalai"],
  "siddhaur": ["sidhaur"],
  "haidergarh": ["haidargarh"],
  "rudhauli": ["rudauli"],
  "saunghat": ["sau-ghat"],
  "mion": ["miaon"],
  "aguta": ["agauta"],
  "lakhaoti": ["lakhaothi"],
  "debai": ["dibai"],
  "chahania": ["chahniya"],
  "niamatabad": ["niyamatabad"],
  "barhani": ["berahani"],
  "chakia": ["chakiya"],
  "tarkulwa": ["tarkalua"],
  "mohammadabad": ["mohamdabad"],
  "muhammadabad-gohna": ["mohammadabad-gohana", "mohammadabadgohana"],
  "teliyani": ["telyani"],
  "deokali": ["devkali"],
  "birno": ["virno"],
  "bhawarkol": ["bhanwarkol"],
  "sahpau": ["sehpau"],
  "mariahu": ["mariyahu"],
  "mogara-badshahpur": ["mungra-badshah-pur", "mungrabadshahpur"],
  "machhlishahr": ["machchali-shahar", "machchalishahar"],
  "guganpur": ["gughrapur"],
  "chaubepur": ["chaubeypur"],
  "sahaver": ["sahawar"],
  "nebua-naurangiya": ["nebua-naurangia"],
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
  "chunar-narayanpur": ["narainpur", "narayanpur"],
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
  "karaundi-kala": ["karaudikala"],
  "miyanganj": ["mianganj"],
  "sikandarpur-sirohi": ["sikandarpur-sarausi"],
  "ghabhana": ["gabhana"],
  "khutahan": ["khuthan"],
  "allahpur": ["budhanpurseohara", "alhepur", "seohara"],
};

const CANONICAL_ALIAS_LOOKUP: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canon, alts] of Object.entries(BLOCK_ALIASES)) {
    const cNorm = canon.toLowerCase().replace(/[^a-z0-9]/g, "");
    m.set(cNorm, cNorm);
    for (const a of alts) {
      m.set(a.toLowerCase().replace(/[^a-z0-9]/g, ""), cNorm);
    }
  }
  return m;
})();

function canonicalAdminKey(slugOrName: string): string {
  const raw = slugOrName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const mapped = CANONICAL_ALIAS_LOOKUP.get(raw) || raw;
  return mapped
    .replace(/ksh/g, "ks")
    .replace(/x/g, "ks")
    .replace(/([bcdfgjklmnpqrstvwxz])h/g, "$1")
    .replace(/z/g, "j")
    .replace(/v|w/g, "b")
    .replace(/y/g, "i")
    .replace(/([a-z])\1+/g, "$1")
    .replace(/au|ou|ao/g, "o")
    .replace(/ee|ea/g, "i")
    .replace(/oo/g, "u")
    .replace(/aa/g, "a");
}

function normalizePhonetic(latin: string): { exact: string; loose: string; skeleton: string } {
  const clean = latin
    .toLowerCase()
    .replace(/\b(tehsil|block|gp|nagar|palika|panchayat|parishad|municipal|corporation|adhishasi|adhishashi|adhikari|khand|vikas|kshetra|eo|bdo|sdm|np|npp|nn)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
  const loose = clean
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
    .replace(/aa/g, "a")
    .replace(/m/g, "n");
  const skeleton = loose.replace(/(?<=.)a(?=[bcdfghjklmnpqrstvwxyz])/g, "");
  return { exact: clean, loose, skeleton };
}

function fuzzyPlaceMatch(placeSlugOrName: string, rowText: string, extraAliases: string[] = []): boolean {
  const expandedRow = /[\u0900-\u097f]/.test(rowText) ? `${rowText} ${devanagariToLatin(rowText)}` : rowText;
  const hay = normalizePhonetic(expandedRow);
  const candidates = [placeSlugOrName, ...(BLOCK_ALIASES[placeSlugOrName] || []), ...extraAliases];

  for (const cand of candidates) {
    const expCand = /[\u0900-\u097f]/.test(cand) ? devanagariToLatin(cand) : cand;
    const p = normalizePhonetic(expCand);
    if (p.exact.length < 3) continue;
    if (hay.exact.includes(p.exact)) return true;
    if (p.loose.length >= 4 && hay.loose.includes(p.loose)) return true;
    if (p.exact.length >= 5 && p.skeleton.length >= 4 && hay.skeleton.includes(p.skeleton)) return true;
  }
  return false;
}

function parseS3waasPage(html: string, url: string): ParsedRow[] {
  const rowsOut: ParsedRow[] = [];
  const pageStdMatch = html.match(/STD\s*(?:Code)?\s*[:\-–]?\s*(0\d{2,4})/i);
  const pageStd = pageStdMatch ? pageStdMatch[1] : undefined;
  let decUrl = url;
  try {
    decUrl = decodeURIComponent(url);
  } catch {}

  for (const tMatch of html.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const table = tMatch[0];
    const tableIdx = tMatch.index ?? 0;
    const beforeHtml = html.slice(Math.max(0, tableIdx - 600), tableIdx);
    const headingMatch = [...beforeHtml.matchAll(/<(?:h[1-4]|caption|strong|p)[^>]*>([\s\S]*?)<\/(?:h[1-4]|caption|strong|p)>/gi)].pop();
    const precedingHeading = headingMatch ? decodeHtml(headingMatch[1]) : "";

    const trs = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    if (trs.length < 2) continue;

    const firstTr = trs[0];
    if (!firstTr) continue;

    const headerRaw = decodeHtml(firstTr);
    const tableStdMatch = headerRaw.match(/STD\s*(?:Code)?\s*[:\-–]?\s*(0\d{2,4})/i);
    const stdHint = tableStdMatch ? tableStdMatch[1] : pageStd;

    const headers = (firstTr.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) || []).map((c) => decodeHtml(c).toLowerCase());
    const phoneCols = headers
      .map((h, idx) => (/phone|mobile|c\.?u\.?g\.?|contact|telephone|landline|मोबाइल|दूरभाष|सीयूजी/.test(h) ? idx : -1))
      .filter((idx) => idx >= 0);
    const colIdx = {
      name: headers.findIndex((h) => /\b(officer\s*name|name)\b|नाम/.test(h) && !/district|block|tehsil|ulb|body/.test(h)),
      desig: headers.findIndex(
        (h) =>
          /designation|officer|post|पद|office\b/.test(h) &&
          !/phone|mobile|c\.?u\.?g\.?|e[\s-]*mail|mail\s*id|\bid$|fax|no\.?$|number|मोबाइल|दूरभाष|ईमेल/.test(h)
      ),
      email: headers.findIndex((h) => /e[\s-]*mail|ईमेल/.test(h)),
      address: headers.findIndex((h) => /address|पता/.test(h)),
    };

    const headingAndHeader = `${precedingHeading} ${headerRaw}`.toLowerCase();

    for (let i = 1; i < trs.length; i++) {
      const cells = (trs[i].match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map((c) => decodeHtml(c));
      if (cells.length < 2) continue;
      // Join all cells with space (keeping adjacent [dot] tokens unified for split email cells)
      const joined = cells.join(" ").replace(/\s+/g, " ").trim();
      if (!joined) continue;

      const email = normalizeEmail(
        (colIdx.email >= 0 ? cells[colIdx.email] : "") || joined
      );
      const phoneSource =
        phoneCols.length > 0
          ? phoneCols.map((idx) => cells[idx] || "").join(" ").trim() || joined
          : joined;
      // Extract landline vs mobile carefully using stdHint only on phone column or explicit full numbers
      const phones = extractPhones(phoneSource, phoneCols.length > 0 ? stdHint : undefined);
      const name = colIdx.name >= 0 && cells[colIdx.name] ? cells[colIdx.name] : "";
      let designation =
        colIdx.desig >= 0 && cells[colIdx.desig]
          ? cells[colIdx.desig]
          : cells.find((c) =>
              /magistrate|development officer|panchayat|sdm|s-d-m|bdo|cdo|dm|ayukt|commissioner|executive|मजिस्ट्रेट|जिलाधिकारी|अधिकारी|आयुक्त/i.test(
                c
              )
            ) || "";
      if (
        designation &&
        (phoneRegex.test(designation) || /^\d{4,}$/.test(designation) || /@|\[at\]|\(at\)/i.test(designation))
      ) {
        designation = "";
      }

      // Infer role on structured Block / Municipality / Tehsil directory tables lacking a Designation column
      if (!designation && (phones.length > 0 || email)) {
        const placeCell = cells.find(
          (c) =>
            c.length >= 3 &&
            c.length <= 60 &&
            !/^\d+\.?$/.test(c) &&
            !/^(?:mobile|mobail|number|nambar|phone|cug|email|vacant|atirikt|prabhari|मोबाइल|नंबर|दूरभाष|ईमेल|अतिरिक्त)$/i.test(c) &&
            extractPhones(c).length === 0 &&
            !normalizeEmail(c) &&
            !/^https?:/i.test(c)
        );
        if (placeCell) {
          if (/tehsil|tahsil|sub[\s-]*div|तहसील/i.test(headingAndHeader) && !/block|vikas|खंड|खण्ड/i.test(headingAndHeader)) {
            designation = `Sub-Divisional Magistrate, ${placeCell}`;
          } else if (
            /block|vikas|खंड|खण्ड|bdo/i.test(headingAndHeader) ||
            (/block|vikas|खंड|खण्ड/i.test(decUrl) && !/tehsil|tahsil|तहसील/i.test(headingAndHeader))
          ) {
            designation = `Block Development Officer, ${placeCell}`;
          } else if (/municip|palika|panchayat|nagar|town|ulb|पालिका|पंचायत|निकाय/i.test(`${headingAndHeader} ${decUrl}`)) {
            designation = `Executive Officer, ${placeCell}`;
          } else if (/tehsil|tahsil|sub[\s-]*div|तहसील/i.test(decUrl)) {
            designation = `Sub-Divisional Magistrate, ${placeCell}`;
          }
        }
      }

      const address = colIdx.address >= 0 && cells[colIdx.address] ? cells[colIdx.address] : "";

      if (designation || phones.length > 0 || email) {
        rowsOut.push({
          url,
          name,
          designation,
          email,
          address,
          phones,
          rawText: `${designation} ${joined}`.trim(),
        });
      }
    }
  }

  // Also parse S3WaaS Public Utility Cards (<li class="public-utlty-catg ...">...</li>)
  const cardBlocks = html.match(/<li[^>]+class=["'][^"']*public-utlty-catg[^"']*["'][\s\S]*?<\/ul>\s*<\/li>/gi) || [];
  for (const card of cardBlocks) {
    const title = decodeHtml(card.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] || "");
    const rawText = decodeHtml(card);
    if (!rawText) continue;
    const email = normalizeEmail(card);
    const phones = extractPhones(rawText, pageStd);
    let inferredDesig = title;
    if (/municip|nagar|palika|panchayat|town|पालिका|पंचायत|निकाय/i.test(decUrl)) {
      inferredDesig = `Executive Officer, ${title}`;
    } else if (/block|vikas|खंड|खण्ड/i.test(decUrl)) {
      inferredDesig = `Block Development Officer, ${title}`;
    } else if (/tehsil|तहसील/i.test(decUrl)) {
      inferredDesig = `Sub-Divisional Magistrate, ${title}`;
    }
    if (title || phones.length > 0 || email) {
      rowsOut.push({
        url,
        name: "",
        designation: inferredDesig,
        email,
        address: rawText.replace(title, "").trim(),
        phones,
        rawText: `${inferredDesig} ${rawText}`.trim(),
      });
    }
  }

  return rowsOut;
}

const MOJIBAKE_RE = /[^\x00-\x7F\u0900-\u097F\u2013\u2014\u2018-\u201D\u00A0]/;

function classifyRowRole(row: ParsedRow): {
  role: "dm" | "cdo" | "dpro" | "sdm" | "bdo" | "eo" | "commissioner" | null;
  haystack: string;
} {
  const hay = `${row.designation} ${row.address} ${row.rawText}`.trim();
  const low = hay.toLowerCase();
  if (MOJIBAKE_RE.test(hay)) {
    return { role: null, haystack: hay };
  }

  // Exclude clearly non-civic / former / deputy / additional posts for district heads
  if (/\b(former|ex[\s-]*dm|sp|superintendent of police|ssp|cmo|chief medical|bsa|basic shiksha|dioc|dios|dio|adeo|judge|advocate|fire|excise|aabkari|treasury|rajistrar|registrar|kaushal|lekhapariksha|shram\s*sansthan|msme)\b/i.test(low) || /अपर|सहायक|उप मुख्य|पुलिस अधीक्षक/.test(low)) {
    // Allow उपजिलाधिकारी / सहायक? No, keep अपर as exclusion for DM/CDO/DPRO
  }

  const isExcludedHead = /\b(former|ex[\s-]*dm|additional|addl|adm\b|city magistrate|sub[\s-]*divisional|s[\s.-]*d[\s.-]*m\b|dy|deputy|asst|assistant|ddo)\b/i.test(low) || /अपर\s|सहायक\s|उप\s*जिला/.test(low);

  if (/\b(former|ex[\s-]*dm|sp|superintendent of police|ssp|cmo|chief medical|bsa|basic shiksha|dioc|dios|dio|adeo|judge|advocate|fire|excise|aabkari|treasury|rajistrar|registrar|kaushal|lekhapariksha|shram\s*sansthan|msme)\b/i.test(low) || /पुलिस अधीक्षक|मुख्य चिकित्सा|जिला विद्यालय|डी[0०.]*आई[0०.]*ओ|ए[0०.]*डी[0०.]*ई[0०.]*ओ/.test(low)) {
    return { role: null, haystack: hay };
  }

  // Commissioner (Municipal Corporation / Nagar Ayukt)
  if ((/\b(municipal commissioner|nagar ayukt)\b/i.test(low) || /नगर आयुक्त/.test(low)) && !/\b(addl|additional|dy|deputy|assistant|asst)\b/i.test(low) && !/अपर|सहायक|उप/.test(low)) {
    return { role: "commissioner", haystack: hay };
  }
  // District Magistrate
  if ((/\b(district magistrate|collector\s*&\s*dm|dm\s*&\s*collector|^dm$)\b/i.test(low) || /(?:^|\s)(जिलाधिकारी|जिला मजिस्ट्रेट)/.test(low)) && !isExcludedHead) {
    return { role: "dm", haystack: hay };
  }
  // Chief Development Officer
  if ((/\b(chief development officer|c\.?d\.?o\.?)\b/i.test(low) || /मुख्य विकास अधिकारी/.test(low)) && !/\b(additional|addl|dy|deputy|asst|assistant|ddo)\b/i.test(low) && !/अपर|सहायक/.test(low)) {
    return { role: "cdo", haystack: hay };
  }
  // District Panchayat Raj Officer
  if ((/\b(district panchayat raj officer|d\.?p\.?r\.?o\.?|zila panchayat raj)\b/i.test(low) || /जिला पंचायत राज अधिकारी|जिला पंचायतराज अधिकारी/.test(low)) && !/\b(addl|adpro|assistant|ado)\b/i.test(low) && !/सहायक|अपर/.test(low)) {
    return { role: "dpro", haystack: hay };
  }
  // Executive Officer acting directly (including EO/SDM holding charge on municipality tables)
  if (
    (/\bexecutive officer\b/i.test(low) || /अधिशासी अधिकारी|(?:^|[\s,(\-/])ई[0०.]*ओ(?=$|[\s,.)\-/0०])/u.test(low)) &&
    !/\b(chief executive|executive engineer|sub[\s-]*divisional|fishery|fisheries|bima|yojana|ado|ceo|dios|dio|adeo|tehsildar|tahasiladar|naib|esadiem|drda|rajistrar|registrar)\b/i.test(low) &&
    !/अभियन्ता|मत्स्य|उप\s*जिलाधिकारी|बीमा|योजना|डी[0०.]*आई[0०.]*ओ|ए[0०.]*डी[0०.]*ई[0०.]*ओ/.test(low)
  ) {
    return { role: "eo", haystack: hay };
  }
  // Sub-Divisional Magistrate
  if (/\b(sub[\s-]*divisional magistrate|s[\s.-]*d[\s.-]*m\.?|sub[\s-]*divisional officer)\b/i.test(low) || /उप\s*जिलाधिकारी|उपजिलाधिकारी|(?:^|[\s,(\-/])एस[0०.]*डी[0०.]*एम(?=$|[\s,.)\-/0०])/u.test(low)) {
    return { role: "sdm", haystack: hay };
  }
  // Block Development Officer
  if ((/\b(block development officer|b\.?d\.?o\.?)\b/i.test(low) || /खंड विकास अधिकारी|खण्ड विकास अधिकारी|(?:^|[\s,(\-/])बी[0०.]*डी[0०.]*ओ(?=$|[\s,.)\-/0०])/u.test(low)) && !/\b(ado|assistant|asst|beo)\b/i.test(low) && !/सहायक|शिक्षा/.test(low)) {
    return { role: "bdo", haystack: hay };
  }
  // Remaining ULB E.O. shorthand
  if (
    /\be\.?o\.?\b/i.test(low) &&
    !/\b(chief executive|executive engineer|fishery|fisheries|bima|yojana|ado|ceo|cdo|dpro|bdo|beo|sdo|dios|dio|adeo|drda)\b/i.test(low) &&
    !/अभियन्ता|मत्स्य|बीमा|योजना/.test(low)
  ) {
    return { role: "eo", haystack: hay };
  }

  return { role: null, haystack: hay };
}

function extractDirectoryPdfs(html: string, pageUrl: string): Array<{ url: string; label: string }> {
  const out = new Map<string, string>();
  let decPage = pageUrl;
  try {
    decPage = decodeURIComponent(pageUrl);
  } catch {}

  const addCandidate = (rawUrl: string, label: string) => {
    let pdfUrl = "";
    try {
      pdfUrl = new URL(rawUrl, pageUrl).href;
    } catch {
      return;
    }
    if (!/^https:\/\//i.test(pdfUrl)) return;
    const combo = `${decPage} ${pdfUrl} ${label}`.toLowerCase();
    if (
      /dir|phone|cug|contact|officer|whos|tel|number|std|bdo|sdm|eo\b|nagar[\s-]*panchayat|municip|palika|nikay|ulb|block|vikas|दूरभाष|संपर्क|अधिकारी|निर्देशिका|दिग्दर्षिका|पालिका|निकाय|ब्लॉक/.test(
        combo
      ) &&
      !/ganga|intach|nmcg|calendar|advisory|faq|epds|policy|form-|audit|tender|election|electoral|roll|guideline|budget|manual|award|gazette|beneficiar|yojana|yojna|school|hospital|police|jail|census|tourism|circle|ward|gram-panchayat-list|lekhpal|लेखपाल|anganwadi/i.test(
        combo
      )
    ) {
      if (!out.has(pdfUrl) || (label && out.get(pdfUrl) === "Directory PDF")) {
        out.set(pdfUrl, label || "Directory PDF");
      }
    }
  };

  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    addCandidate(m[1], decodeHtml(m[2]));
  }
  for (const m of html.matchAll(/<(?:iframe|embed|object)[^>]+(?:src|data)=["']([^"']+\.pdf[^"']*)["']/gi)) {
    addCandidate(m[1], decodeHtml(decPage.split("/").filter(Boolean).pop() || ""));
  }
  for (const m of html.matchAll(/https:\/\/cdn\.s3waas\.gov\.in\/[^"'\s<>()]+\.pdf/gi)) {
    addCandidate(m[0], "S3WaaS Document PDF");
  }
  // Reconstruct S3WaaS CDN PDF URLs from WordPress document permalink slugs (e.g. Shravasti contact-directory)
  const slugSources = [pageUrl, ...Array.from(html.matchAll(/href=["']([^"']*https-cdn-s3waas-gov-in-[^"']+)["']/gi)).map((m) => m[1])];
  for (const src of slugSources) {
    const slugM = src.match(/https-cdn-s3waas-gov-in-(s3[0-9a-f]+)-uploads-(\d{4})-(\d{2})-(\d{6,16})-pdf/i);
    if (slugM) {
      const cdnPdf = `https://cdn.s3waas.gov.in/${slugM[1]}/uploads/${slugM[2]}/${slugM[3]}/${slugM[4]}.pdf`;
      addCandidate(cdnPdf, decodeHtml(src));
    }
  }

  return [...out.entries()].map(([url, label]) => ({ url, label }));
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const cur = items[idx++];
      await worker(cur);
    }
  });
  await Promise.all(workers);
}

async function fetchPdfBuffer(url: string, ms = 25000): Promise<Buffer | null> {
  if (!/^https:\/\//i.test(url)) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(ms),
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "application/pdf,*/*;q=0.8",
        },
        redirect: "follow",
      });
      if (!res.ok) {
        if (process.env.ONLY_DISTRICT) console.log(`[PDF HTTP ${res.status}]`, url);
        return null;
      }
      const len = Number(res.headers.get("content-length") || 0);
      if (len > 5_500_000) {
        if (process.env.ONLY_DISTRICT) console.log(`[PDF TOO BIG ${len}]`, url);
        return null;
      }
      const arr = await res.arrayBuffer();
      if (arr.byteLength < 500 || arr.byteLength > 5_500_000) {
        if (process.env.ONLY_DISTRICT) console.log(`[PDF BAD SIZE ${arr.byteLength}]`, url);
        return null;
      }
      return Buffer.from(arr);
    } catch (e: any) {
      if (process.env.ONLY_DISTRICT) console.log(`[PDF ERR attempt=${attempt}]`, url, e?.cause?.message || e?.message || e);
      if (attempt === 1) return null;
    }
  }
  return null;
}

async function fetchHtml(url: string, ms = 10000): Promise<{ finalUrl: string; html: string } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(ms),
        headers: { "User-Agent": BROWSER_UA },
        redirect: "follow",
      });
      if (!res.ok) return null;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("html") && !ct.includes("text")) return null;
      return { finalUrl: res.url, html: await res.text() };
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

function extractNavLinks(html: string, origin: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const rawHref = m[1];
    const linkText = decodeHtml(m[2]).toLowerCase();
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) continue;
    let abs = "";
    try {
      abs = new URL(rawHref, origin).href;
    } catch {
      continue;
    }
    if (!abs.startsWith(origin)) continue;
    if (/\.(?:pdf|xlsx?|csv|png|jpe?g|gif|svg|css|js|zip)$/i.test(abs)) continue;
    let decAbs = abs;
    try {
      decAbs = decodeURIComponent(abs);
    } catch {}
    const combo = `${decAbs} ${linkText}`;
    if (
      /who|dir|contact|phone|telephone|cug|offic|tehsil|block|develop|municip|nagarnigam|collectrate|collectorate|panchayat|std|urban-local|vikas|gramya|निर्देशिका|कौन|संपर्क|अधिकारी|विकास|खण्ड|खंड|नगर|निकाय|दूरभाष|तहसील|अभिकरण/i.test(
        combo
      ) &&
      !/eoffice|training|video|notice|tender|recruitment|anganwadi|bsa-office|aabkari|former|election|circle-rate|registration|banks|hospital|school|college|postal|electricity|police-station/i.test(
        combo
      )
    ) {
      out.add(abs.split("#")[0]);
    }
  }
  return [...out];
}

async function harvestStateNagarNigams(): Promise<
  Map<string, { city: string; website: string; mayorName: string; mayorPhone: string; commName: string; commPhones: string[]; commEmail: string }>
> {
  const map = new Map();
  const res = await fetchHtml("https://localbodies.up.nic.in/listnn.htm", 12000);
  if (!res) return map;

  const districtHiToId: Record<string, string> = {
    "अयोध्या": "ayodhya",
    "अलीगढ़": "aligarh",
    "अलीगढ़": "aligarh",
    "आगरा": "agra",
    "कानपुर नगर": "kanpur-nagar",
    "गाजियाबाद": "ghaziabad",
    "गाज़ियाबाद": "ghaziabad",
    "गोरखपुर": "gorakhpur",
    "झांसी": "jhansi",
    "झाँसी": "jhansi",
    "प्रयागराज": "prayagraj",
    "फिरोज़ाबाद": "firozabad",
    "फिरोजाबाद": "firozabad",
    "बरेली": "bareilly",
    "मथुरा": "mathura",
    "मेरठ": "meerut",
    "मुरादाबाद": "moradabad",
    "लखनऊ": "lucknow",
    "वाराणसी": "varanasi",
    "शाहजहाँपुर": "shahjahanpur",
    "शाहजहांपुर": "shahjahanpur",
    "सहारनपुर": "saharanpur",
  };

  const trs = res.html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trs) {
    const cells = (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map((c) => decodeHtml(c));
    if (cells.length < 5) continue;
    const distHi = cells[1]?.trim();
    const dId = districtHiToId[distHi];
    if (!dId) continue;

    // Columns (5 cells): [0]=SNo | [1]=District | [2]=City+Website | [3]=Mayor+Mobile+Address | [4]=Commissioner+Phones+Email
    const cityCell = cells[2] || "";
    const website = cityCell.match(/https?:\/\/\S+|www\.\S+/i)?.[0] || "";
    const mayorCell = cells[3] || "";
    const mayorPhones = extractPhones(mayorCell);
    const mayorName = mayorCell.split(/\d/)[0]?.trim() || "";
    const commCellRaw = cells[4] || "";
    // Separate glued phone & email tokens (e.g. "8189077822nnlko@up.nic.in")
    const commCell = commCellRaw
      .replace(/(\d{6,})([a-zA-Z])/g, "$1 $2")
      .replace(/([a-zA-Z])(\d{6,})/g, "$1 $2");
    const commPhones = extractPhones(commCell);
    const commEmail = normalizeEmail(commCell);
    const commName = commCell
      .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "")
      .replace(/[\d,-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    map.set(dId, {
      city: cityCell.replace(/https?:\/\/\S+|www\.\S+/gi, "").trim() || distHi,
      website,
      mayorName,
      mayorPhone: mayorPhones[0] || "",
      commName,
      commPhones,
      commEmail,
    });
  }
  return map;
}

async function loadLgdCacheRows(): Promise<any[]> {
  const lgdPath = path.join(process.cwd(), ".cache", "lgd", "villages_by_blocks.parquet");
  if (!fs.existsSync(lgdPath)) return [];
  const { parquetReadObjects } = requireCjs("hyparquet");
  const { compressors } = requireCjs("hyparquet-compressors");
  const buf = fs.readFileSync(lgdPath);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return (await parquetReadObjects({ file: ab, compressors })).filter((r: any) => String(r.state_code) === "9");
}

function cleanDistrictOffices(dId: string, dEntry: any, distData: any) {
  // 1. Remove synthetic pilot 'sec-*' placeholder offices, mojibake PDF garbage, and non-civic/misclassified EOs
  const NON_CIVIC_EO_RE =
    /\b(?:dios|dio|di\.ai\.o|di0ai|a\.?d\.?e\.?o|tehsildar|tahasiladar|naib|esadiem|drda|project\s*director|rajistrar|registrar|kaushal|prashikshan|lekhapariksha|lekha\s*karyalay|shram\s*sansthan|ema\s*esa\s*ema\s*i)\b/i;

  // Before pruning Kanpur Nagar's legacy 'eo-kanpur-municipality-corporation', preserve its landline on Commissioner if needed
  if (dId === "kanpur-nagar") {
    const legacyCorp = (distData.offices || []).find(
      (o: any) => o.id === "up-kanpur-nagar-eo-kanpur-municipality-corporation"
    );
    const comm = (distData.offices || []).find((o: any) => o.role === "commissioner");
    if (legacyCorp && comm) {
      for (const p of legacyCorp.phones || []) {
        if (!comm.phones.some((cp: any) => cp.number === p.number)) {
          comm.phones.push(p);
        }
      }
    }
  }

  // Known duplicate / transliterated / typo EO IDs to prune cleanly (keeping verified main/authority offices)
  const PRUNE_EXACT_IDS = new Set([
    "up-kanpur-nagar-eo-kanpur-municipality-corporation",
    "up-gautam-buddha-nagar-eo-gretar-noeda-audyogik-vikas-pradhikaran",
    "up-gautam-buddha-nagar-eo-nai-okhala-audyogik-vikas-pradhikaran",
    "up-farrukhabad-eo-praishad-farrukhabad",
    "up-etah-eo-n-p-p-etah",
    "up-fatehpur-eo-hathaganm",
    "up-sant-kabir-nagar-eo-dharmasinhava",
    "up-sant-kabir-nagar-eo-hainsar-bazar-dhanghata",
    "up-sant-kabir-nagar-eo-bakhira-urf-baghnagar",
    "up-barabanki-eo-nagarapalika-navabaganj",
  ]);

  // Preserve Barabanki Nawabganj phone if main lacks it
  if (dId === "barabanki") {
    const mainEo = (distData.offices || []).find((o: any) => o.id === "eo-barabanki-main");
    const dupEo = (distData.offices || []).find((o: any) => o.id === "up-barabanki-eo-nagarapalika-navabaganj");
    if (mainEo && dupEo) {
      for (const p of dupEo.phones || []) {
        if (!mainEo.phones.some((mp: any) => mp.number === p.number)) mainEo.phones.push(p);
      }
    }
  }

  distData.offices = (distData.offices || []).filter((o: any) => {
    if (o.role === "secretary" && /^sec-/.test(o.id || "")) return false;
    if (PRUNE_EXACT_IDS.has(o.id)) return false;
    const text = `${o.office_name_en || ""} ${o.office_name_hi || ""}`;
    if (MOJIBAKE_RE.test(text) || /i0o0/i.test(o.id || "")) return false;
    if (o.role === "eo" && NON_CIVIC_EO_RE.test(`${o.id} ${o.office_name_en || ""}`)) return false;
    return true;
  });

  // Fix Jaunpur legacy 'baksha-18' duplicate block label -> Suitha Kala
  if (dId === "jaunpur") {
    for (const o of distData.offices) {
      if (o.id === "up-jaunpur-bdo-baksha-18") {
        o.office_name_en = "Block Development Officer, Block Suitha Kala";
        o.office_name_hi = "खंड विकास अधिकारी, विकास खंड सुइथा कलाँ";
        o.covers = ["suitha-kala"];
      } else if (o.id === "up-jaunpur-ado-baksha-18") {
        o.office_name_en = "Assistant Development Officer (Panchayat), Block Suitha Kala";
        o.office_name_hi = "सहायक विकास अधिकारी (पंचायत), विकास खंड सुइथा कलाँ";
        o.covers = ["suitha-kala"];
      }
    }
  }

  // Remove district-specific historical typo block entries when canonical block exists
  if (dId === "budaun" && distData.offices.some((o: any) => o.id === "up-budaun-bdo-mion")) {
    distData.offices = distData.offices.filter(
      (o: any) => o.id !== "up-budaun-bdo-miyanganj" && o.id !== "up-budaun-ado-miyanganj"
    );
  }
  if (dId === "bahraich" && distData.offices.some((o: any) => o.id === "up-bahraich-bdo-nawabganj")) {
    distData.offices = distData.offices.filter(
      (o: any) => o.id !== "up-bahraich-bdo-bawabganj" && o.id !== "up-bahraich-ado-bawabganj"
    );
  }

  // Deduplicate spelling-variant BDOs and SDMs created across LGD vs NIC harvests (preserving phones & cleaning ADOs)
  const dedupRole = (role: "bdo" | "sdm") => {
    const items = distData.offices.filter((o: any) => o.role === role);
    const keyMap = new Map<string, any[]>();
    const distCanon = canonicalAdminKey(dEntry.name_en || dId);
    const getGroupKey = (off: any): string => {
      const slug = off.covers?.[0] || off.id;
      let k = canonicalAdminKey(slug);
      if (k.endsWith("sadar") && k.length > 5) {
        const stem = k.slice(0, -5);
        if (stem === distCanon || stem === canonicalAdminKey(dId)) k = stem;
      }
      if (k === "sadar") k = distCanon;
      return k;
    };

    for (const item of items) {
      const k = getGroupKey(item);
      if (!keyMap.has(k)) keyMap.set(k, []);
      keyMap.get(k)!.push(item);
    }

    const dropIds = new Map<string, string>(); // droppedOfficeId -> keptOfficeId
    const dropAdoSlugs = new Set<string>();

    for (const [, group] of keyMap.entries()) {
      if (group.length <= 1) continue;
      // Prefer: (1) already-canonical non-phoneless record with most phones, (2) has "-sadar" or earlier entry
      group.sort((a, b) => {
        const pDiff = (b.phones?.length || 0) - (a.phones?.length || 0);
        if (pDiff !== 0) return pDiff;
        const aSadar = (a.covers?.[0] || "").includes("sadar") ? 1 : 0;
        const bSadar = (b.covers?.[0] || "").includes("sadar") ? 1 : 0;
        if (bSadar !== aSadar) return bSadar - aSadar;
        // Prefer 'mion' over wrong 'miyanganj' in Budaun, 'nawabganj' over typo 'bawabganj' in Bahraich
        const aTypo = /bawabganj|miyanganj/.test(a.id) && dId !== "unnao" ? 1 : 0;
        const bTypo = /bawabganj|miyanganj/.test(b.id) && dId !== "unnao" ? 1 : 0;
        if (aTypo !== bTypo) return aTypo - bTypo;
        return 0;
      });
      const keep = group[0];
      for (let i = 1; i < group.length; i++) {
        const dup = group[i];
        dropIds.set(dup.id, keep.id);
        if (role === "bdo" && dup.covers?.[0]) {
          dropAdoSlugs.add(dup.covers[0]);
        }
        for (const p of dup.phones || []) {
          if (!keep.phones.some((kp: any) => kp.number === p.number)) {
            keep.phones.push(p);
          }
        }
        if (!keep.email && dup.email) keep.email = dup.email;
        if (!keep.officer_name_en && dup.officer_name_en) keep.officer_name_en = dup.officer_name_en;
        if (!keep.address_en && dup.address_en) keep.address_en = dup.address_en;
      }
    }

    if (dropIds.size > 0) {
      distData.offices = distData.offices.filter((o: any) => {
        if (dropIds.has(o.id)) return false;
        if (o.role === "ado_panchayat" && dropAdoSlugs.has(o.covers?.[0])) return false;
        return true;
      });
      for (const o of distData.offices) {
        if (o.fallback_office_id && dropIds.has(o.fallback_office_id)) {
          o.fallback_office_id = dropIds.get(o.fallback_office_id);
        }
      }
    }
  };
  dedupRole("bdo");
  dedupRole("sdm");

  // Fix Gautam Buddha Nagar Authority entries (Noida clean address + YEIDA verified authority office)
  if (dId === "gautam-buddha-nagar") {
    const noidaOff = distData.offices.find(
      (o: any) => o.id === "up-gautam-buddha-nagar-eo-new-okhla-industrial-development-authority"
    );
    if (noidaOff) {
      noidaOff.address_en = "Administrative Complex, Sector-6, Noida-201301, Gautam Buddha Nagar, U.P.";
      noidaOff.source_url = "https://gbnagar.nic.in/public-utility-category/authority/";
    }
    const yeidaId = "up-gautam-buddha-nagar-eo-yamuna-expressway-industrial-development-authority";
    if (!distData.offices.some((o: any) => o.id === yeidaId)) {
      distData.offices.push({
        id: yeidaId,
        level: "ulb",
        role: "eo",
        office_name_en: "Executive Officer, Yamuna Expressway Industrial Development Authority (YEIDA)",
        office_name_hi: "अधिशासी अधिकारी, यमुना एक्सप्रेसवे औद्योगिक विकास प्राधिकरण",
        phones: [
          {
            number: "0120-2395153",
            type: "landline",
            source_url: "https://gbnagar.nic.in/public-utility-category/authority/",
            checked_on: TODAY,
            status: "verified",
          },
        ],
        email: "queries@yamunaexpresswayauthority.com",
        address_en: "First Floor, Commercial Complex, P-2, Sector-Omega I, Greater Noida, Gautam Buddha Nagar, U.P.",
        covers: ["ulb-yamuna-expressway-industrial-development-authority"],
        source_url: "https://gbnagar.nic.in/public-utility-category/authority/",
        confidence: "high",
        valid_as_of: TODAY,
      });
    }
  }

  const usedCleanPhones = new Set<string>();
  const DESIG_TITLE_HI_RE =
    /^(?:उप\s*[जज़]िलाधिकारी|जिला\s*पंचायत\s*राज|ख[णड]+ड\s*विकास\s*अधिकारी|अधिशासी\s*अधिकारी|अपर\s+|जिलाधिकारी|मुख्य\s*विकास\s*अधिकारी|नगर\s*आयुक्त)/u;

  for (const off of distData.offices) {
    // Fix KrutiDev '0' dot abbreviations (e.g., Bi0bi0nagar -> B.B. Nagar, बी0बी0नगर -> बी.बी.नगर)
    if (off.office_name_en && /[a-z]0[a-z]/i.test(off.office_name_en)) {
      off.office_name_en = off.office_name_en
        .replace(/\bBi0bi0nagar\b/gi, "B.B. Nagar")
        .replace(/\bPan0di0d0nagar\b/gi, "Pt. D.D. Nagar")
        .replace(/([A-Za-z])0(?=[A-Za-z])/g, "$1.");
    }
    if (off.office_name_hi) {
      off.office_name_hi = off.office_name_hi
        .replace(/([\u0900-\u097f])0+(?=[\u0900-\u097f]|\s|$|[,.:;)\]-])/g, "$1.")
        .replace(/मुनिचिपल\s*बोअरद/g, "नगर पालिका परिषद")
        .replace(/मुनिचिपलित्य\s*चोरपोरतिओन/g, "नगर निगम");
    }

    // Clean email: drop synthetic placeholders, strip glued prefixes, validate
    if (off.email) {
      let em = String(off.email).trim().toLowerCase();
      em = cleanEmailLocalPart(em);
      if (!VALID_EMAIL_RE.test(em) || SYNTHETIC_GMAIL_RE.test(em)) {
        delete off.email;
      } else {
        off.email = em;
      }
    }

    // Clean phones: normalize Devanagari digits, fix 4-digit UP STD mis-splits, deduplicate across district
    if (Array.isArray(off.phones)) {
      const cleanedPhones: any[] = [];
      const seenLocal = new Set<string>();
      const rawNums = off.phones.map((p: any) => normalizeDevanagariDigits(String(p.number || "")).replace(/\s+/g, ""));
      for (const p of off.phones) {
        let num = normalizeDevanagariDigits(String(p.number || "")).replace(/\s+/g, "");
        if (/^91\d{8}$/.test(num) && rawNums.some((other: string) => other !== num && other.startsWith(num.slice(2)))) {
          continue;
        }
        if (num.startsWith("0") && num.includes("-")) {
          const digits = num.replace(/-/g, "");
          const fixed = splitStdNumber(digits);
          if (fixed) num = fixed;
        }
        if (!phoneRegex.test(num)) continue;
        if (seenLocal.has(num)) continue;
        if (usedCleanPhones.has(num) && !off.notes) continue;
        seenLocal.add(num);
        usedCleanPhones.add(num);
        cleanedPhones.push({ ...p, number: num });
      }
      off.phones = cleanedPhones;
    }

    // Clean Devanagari inside English fields
    if (off.officer_name_en && /[\u0900-\u097f]/.test(off.officer_name_en)) {
      const raw = String(off.officer_name_en).trim();
      if (DESIG_TITLE_HI_RE.test(raw)) {
        delete off.officer_name_en;
      } else {
        if (!off.officer_name_hi) off.officer_name_hi = raw;
        const latin = devanagariToLatin(raw)
          .replace(/[\u0900-\u097f]/g, "")
          .replace(/\bshri\b/gi, "Shri")
          .replace(/\bsmt\b/gi, "Smt.")
          .replace(/\bdr\b/gi, "Dr.")
          .replace(/\b[a-z]/g, (c) => c.toUpperCase())
          .replace(/\s+/g, " ")
          .trim();
        if (latin.length >= 3) off.officer_name_en = latin;
        else delete off.officer_name_en;
      }
    }

    if (off.address_en && /[\u0900-\u097f]/.test(off.address_en)) {
      const rawAddr = String(off.address_en).trim();
      if (!off.address_hi) off.address_hi = rawAddr;
      const asciiOnly = rawAddr
        .replace(/[\u0900-\u097f]+/g, " ")
        .replace(/^[\s,.:;\-–()]+|[\s,.:;\-–()]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (/[a-zA-Z]{4,}/.test(asciiOnly)) off.address_en = asciiOnly;
      else delete off.address_en;
    }

    if (off.office_name_en && /[\u0900-\u097f]/.test(off.office_name_en)) {
      off.office_name_en = devanagariToLatin(off.office_name_en).replace(/[\u0900-\u097f]/g, "").replace(/\s+/g, " ").trim();
    }

    // Localize English block/tehsil/authority labels inside office_name_hi
    if (off.office_name_hi && /[A-Za-z]/.test(off.office_name_hi)) {
      off.office_name_hi = latinToDevanagari(off.office_name_hi);
    }
  }
}

async function run() {
  const cleanOnly = process.env.CLEAN_ONLY === "true";
  console.log(cleanOnly ? "🧹 Running Directory Data Cleanup & Coverage Rebuild..." : "🚀 Starting UP Statewide Official Multi-Source Harvester...");
  const districtsIndex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "districts.json"), "utf8"));

  // Load cached LGD villages_by_blocks if available so genuinely missing LGD blocks/tehsils can be registered cleanly
  const lgdVbbRows = await loadLgdCacheRows();
  const { normalizeUpDistrictSlug } = await import("../lib/pincode");
  const lgdBlocksByDist = new Map<string, Set<string>>();
  const lgdSubsByDist = new Map<string, Set<string>>();
  for (const r of lgdVbbRows) {
    const dId = normalizeUpDistrictSlug(String(r.district_name || ""));
    if (!dId) continue;
    const bName = String(r.block_name || "").trim();
    const sName = String(r.subdistrict_name || "").trim();
    if (bName) {
      if (!lgdBlocksByDist.has(dId)) lgdBlocksByDist.set(dId, new Set());
      lgdBlocksByDist.get(dId)!.add(bName);
    }
    if (sName) {
      if (!lgdSubsByDist.has(dId)) lgdSubsByDist.set(dId, new Set());
      lgdSubsByDist.get(dId)!.add(sName);
    }
  }

  // 1. Fetch UP S3WaaS Master District URL list (unless CLEAN_ONLY)
  const s3Urls = new Map<string, string>();
  const nnMap = cleanOnly ? new Map() : await harvestStateNagarNigams();
  if (!cleanOnly) {
    const masterPage = await fetchHtml("https://uttarpradesh.s3waas.gov.in/", 15000);
    if (masterPage) {
      for (const m of masterPage.html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
        const url = m[1].replace(/\/+$/, "");
        const text = decodeHtml(m[2]).toLowerCase().replace(/[^a-z]/g, "");
        if (text && /\.(nic|gov)\.in$/i.test(url) && !/uttarpradesh\.s3waas|up\.gov\.in|s3waas\.gov\.in$/.test(url)) {
          if (!s3Urls.has(text)) s3Urls.set(text, url);
        }
      }
    }
    console.log(`🏛️ Loaded ${nnMap.size}/17 Municipal Corporations from localbodies.up.nic.in`);
  }

  const commonPaths = [
    "/about-district/whos-who/",
    "/who-is-who/",
    "/whos-who/",
    "/hi/whos-who/",
    "/hi/about-district/whos-who/",
    "/hi/who-is-who/",
    "/officers-phones/",
    "/hi/officers-phones/",
    "/contact-directory/",
    "/hi/contact-directory/",
    "/contact-directory-2/",
    "/contact-details/",
    "/contact-numbers/",
    "/phone-directory/",
    "/important-numbers/",
    "/important-phone-numbers/",
    "/cug-numbers/",
    "/telephone_directory/",
    "/telephone-dir-eng/",
    "/telephone-directory/",
    "/hi/telephone-directory/",
    "/imp-phone-number/",
    "/directory/",
    "/hi/directory/",
    "/telephone/",
    "/contact-us/",
    "/tehsil/",
    "/tehsils/",
    "/subdivision-blocks/",
    "/hi/subdivision-blocks/",
    "/block-details/",
    "/hi/block-details/",
    "/development-block/",
    "/development-blocks/",
    "/drda/",
    "/block/",
    "/blocks/",
    "/public-utility-category/blocks/",
    "/public-utility-category/block/",
    "/public-utility-category/municipality/",
    "/public-utility-category/municipalities/",
    "/public-utility-category/nagar-palika/",
    "/public-utility-category/nagar-panchayat/",
    "/public-utility-category/authority/",
    "/document-category/telephone-directory/",
    "/document-category/directory/",
    "/urban-local-bodies/",
    "/local-bodies/",
    "/municipalities/",
    "/nagar-palika-parishad/",
    "/nagar_palika_panchayat",
    "/municipality/",
  ];

  const metrics = {
    districtsProcessed: 0,
    pagesScanned: 0,
    officesPhoneAdded: 0,
    officesEmailUpdated: 0,
    officesNameUpdated: 0,
    commissionersAdded: 0,
  };

  // Process districts in batches of 5 with bounded per-district concurrency to avoid NIC/S3WaaS throttling
  const onlyDist = process.env.ONLY_DISTRICT?.trim();
  const onlySet = onlyDist ? new Set(onlyDist.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  const targetDistricts = onlySet ? districtsIndex.filter((d: any) => onlySet.has(d.id)) : districtsIndex;
  const batchSize = 5;
  for (let i = 0; i < targetDistricts.length; i += batchSize) {
    const batch = targetDistricts.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (dEntry: any) => {
        const dId: string = dEntry.id;
        const distFile = path.join(DATA_DIR, "districts", `${dId}.json`);
        if (!fs.existsSync(distFile)) return;
        const distData = JSON.parse(fs.readFileSync(distFile, "utf8"));

        // Run initial hygiene pass first (e.g., fixes baksha-18 -> suitha-kala before LGD block seeding)
        cleanDistrictOffices(dId, dEntry, distData);

        // Seed any genuinely missing LGD blocks or tehsils before matching
        const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const existingBdoSlugs = new Set<string>(
          distData.offices.filter((o: any) => o.role === "bdo").map((o: any) => o.covers?.[0]).filter(Boolean)
        );
        const existingSdmSlugs = new Set<string>(
          distData.offices.filter((o: any) => o.role === "sdm").map((o: any) => o.covers?.[0]).filter(Boolean)
        );
        const hasApproxMatch = (cand: string, set: Set<string>) => {
          const cNorm = normalizePhonetic(cand).skeleton;
          const cCanon = canonicalAdminKey(cand);
          for (const ex of set) {
            const exCanon = canonicalAdminKey(ex);
            if (cCanon === exCanon) return true;
            if (exCanon.endsWith("sadar") && exCanon.slice(0, -5) === cCanon) return true;
            if (cCanon.endsWith("sadar") && cCanon.slice(0, -5) === exCanon) return true;
            const aliases = [ex, ...(BLOCK_ALIASES[ex] || [])];
            if (
              aliases.some(
                (a) =>
                  canonicalAdminKey(a) === cCanon ||
                  normalizePhonetic(a).exact === normalizePhonetic(cand).exact ||
                  (cNorm.length >= 4 && normalizePhonetic(a).skeleton === cNorm)
              )
            ) {
              return true;
            }
          }
          return false;
        };

        // Ensure Bareilly Nawabganj & Bhadpura and LGD missing blocks/tehsils are created cleanly
        for (const blkName of lgdBlocksByDist.get(dId) || []) {
          const slug = toSlug(blkName);
          if (!slug || existingBdoSlugs.has(slug)) continue;
          if (hasApproxMatch(blkName, existingBdoSlugs)) continue;
          // Check fuzzyPlaceMatch against existing BDOs
          if (distData.offices.some((o: any) => o.role === "bdo" && fuzzyPlaceMatch(o.covers?.[0] || "", blkName))) continue;
          const bdoId = `up-${dId}-bdo-${slug}`;
          const adoId = `up-${dId}-ado-${slug}`;
          if (!distData.offices.some((o: any) => o.id === bdoId)) {
            distData.offices.push({
              id: bdoId,
              level: "block",
              role: "bdo",
              office_name_en: `Block Development Officer, Block ${blkName}`,
              office_name_hi: `खंड विकास अधिकारी, विकास खंड ${latinToDevanagari(blkName)}`,
              phones: [],
              covers: [slug],
              source_url: `https://${dId.replace(/[^a-z]/g, "")}.nic.in`,
              confidence: "medium",
              valid_as_of: TODAY,
            });
            existingBdoSlugs.add(slug);
          }
          if (!distData.offices.some((o: any) => o.id === adoId)) {
            distData.offices.push({
              id: adoId,
              level: "block",
              role: "ado_panchayat",
              office_name_en: `Assistant Development Officer (Panchayat), Block ${blkName}`,
              office_name_hi: `सहायक विकास अधिकारी (पंचायत), विकास खंड ${latinToDevanagari(blkName)}`,
              phones: [],
              covers: [slug],
              fallback_office_id: bdoId,
              source_url: `https://${dId.replace(/[^a-z]/g, "")}.nic.in`,
              confidence: "medium",
              valid_as_of: TODAY,
            });
          }
        }

        for (const subName of lgdSubsByDist.get(dId) || []) {
          const slug = toSlug(subName);
          if (!slug || existingSdmSlugs.has(slug)) continue;
          const subClean = normalizePhonetic(subName).exact;
          const isDistHqSadar =
            (subClean === normalizePhonetic(dEntry.name_en).exact ||
              subClean === "faizabad" ||
              subClean === "allahabad" ||
              subClean === "maunathbhanjan") &&
            [...existingSdmSlugs].some((s) => s.includes("sadar"));
          if (isDistHqSadar || hasApproxMatch(subName, existingSdmSlugs)) continue;
          if (distData.offices.some((o: any) => o.role === "sdm" && fuzzyPlaceMatch(o.covers?.[0] || "", subName))) continue;
          const sdmId = `up-${dId}-sdm-${slug}`;
          if (!distData.offices.some((o: any) => o.id === sdmId)) {
            distData.offices.push({
              id: sdmId,
              level: "tehsil",
              role: "sdm",
              office_name_en: `Sub-Divisional Magistrate (SDM), Tehsil ${subName}`,
              office_name_hi: `उपजिलाधिकारी (एसडीएम), तहसील ${latinToDevanagari(subName)}`,
              phones: [],
              covers: [slug],
              source_url: `https://${dId.replace(/[^a-z]/g, "")}.nic.in`,
              confidence: "medium",
              valid_as_of: TODAY,
            });
            existingSdmSlugs.add(slug);
          }
        }

        const normId = dId.replace(/[^a-z]/g, "");
        const normName = dEntry.name_en.toLowerCase().replace(/[^a-z]/g, "");
        const baseUrl = MANUAL_URL_MAP[dId] || s3Urls.get(normId) || s3Urls.get(normName) || `https://${normId}.nic.in`;

        const allRows: ParsedRow[] = [];
        if (!cleanOnly) {
          // Depth 1: fetch both EN and HI homepages so bilingual S3WaaS menus are discovered
          const visited = new Set<string>();
          const homeLinks = new Set<string>();
          const [home, homeHi] = await Promise.all([fetchHtml(baseUrl + "/", 9000), fetchHtml(baseUrl + "/hi/", 8000)]);
          const effOrigin = home ? new URL(home.finalUrl).origin : baseUrl;
          if (home) {
            for (const u of extractNavLinks(home.html, effOrigin)) homeLinks.add(u);
          }
          if (homeHi) {
            const hiOrigin = new URL(homeHi.finalUrl).origin;
            for (const u of extractNavLinks(homeHi.html, hiOrigin)) homeLinks.add(u);
          }

          // Prioritize core directory/block/ULB paths & matching homepage links ahead of generic menu links
          const queue = new Set<string>();
          for (const u of homeLinks) {
            if (/who|dir|contact|telephone|block|municip|ulb|local-bodies|drda|निर्देशिका|कौन|संपर्क|विकास|नगर|पालिका/i.test(decodeURIComponent(u))) {
              queue.add(u);
            }
          }
          for (const p of commonPaths) queue.add(effOrigin + p);
          for (const u of homeLinks) queue.add(u);

          const pdfCandidates = new Map<string, string>();
          const collectPdfs = (html: string, pageUrl: string) => {
            for (const pdf of extractDirectoryPdfs(html, pageUrl)) {
              if (!pdfCandidates.has(pdf.url)) pdfCandidates.set(pdf.url, pdf.label);
            }
          };
          if (home) collectPdfs(home.html, home.finalUrl);
          if (homeHi) collectPdfs(homeHi.html, homeHi.finalUrl);

          // Depth 1.5 + 2 crawl (125 initial + 55 depth2 / pagination / document pages)
          const toVisit = [...queue].slice(0, 125);
          const depth2 = new Set<string>();

          await mapLimit(toVisit, 10, async (u) => {
            if (visited.has(u)) return;
            visited.add(u);
            const page = await fetchHtml(u, 10000);
            if (!page) return;
            metrics.pagesScanned++;
            const parsed = parseS3waasPage(page.html, page.finalUrl);
            allRows.push(...parsed);
            collectPdfs(page.html, page.finalUrl);

            // Follow sublinks on directory/telephone/document hub pages + pagination on public-utility-category pages
            let decU = u;
            try {
              decU = decodeURIComponent(u);
            } catch {}
            if (/directory|telephone|officers|contact|public-utility-category|document-category|municip|block|nikay|palika|निर्देशिका|निकाय|विकास|पालिका/i.test(decU)) {
              const origin = new URL(page.finalUrl).origin;
              for (const sub of extractNavLinks(page.html, origin)) {
                if (!visited.has(sub)) depth2.add(sub);
              }
              for (const docM of page.html.matchAll(/href=["']([^"']*\/document\/[^"']+)["']/gi)) {
                try {
                  const docAbs = new URL(docM[1], page.finalUrl).href.split("#")[0];
                  if (docAbs.startsWith(origin) && !visited.has(docAbs)) depth2.add(docAbs);
                } catch {}
              }
              for (const pgM of page.html.matchAll(/href=["']([^"']*\/page\/[2-8]\/?)["']/gi)) {
                try {
                  const nextPg = new URL(pgM[1], page.finalUrl).href;
                  if (!visited.has(nextPg)) depth2.add(nextPg);
                } catch {}
              }
            }
          });

          const d2List = [...depth2].slice(0, 55);
          await mapLimit(d2List, 10, async (u) => {
            if (visited.has(u)) return;
            visited.add(u);
            const page = await fetchHtml(u, 10000);
            if (!page) return;
            metrics.pagesScanned++;
            allRows.push(...parseS3waasPage(page.html, page.finalUrl));
            collectPdfs(page.html, page.finalUrl);
          });

          // Depth 2.5: parse up to 8 prioritized verified district directory PDFs (Unicode or Kruti Dev 010)
          const scorePdf = (url: string, label: string) => {
            const t = `${url} ${label}`.toLowerCase();
            let s = 0;
            if (/muni|ulb|palika|nikay|nagar[\s-]*panchayat|bdo|block|cug|\beo\b|sdm|पालिका|निकाय/.test(t)) s += 10;
            if (/dir|contact|phone|tel|officer|whos|दूरभाष|संपर्क|निर्देशिका|अधिकारी/.test(t)) s += 5;
            if (/202[3-6]/.test(t)) s += 2;
            return s;
          };
          const pdfUrls = [...pdfCandidates.entries()]
            .sort((a, b) => scorePdf(b[0], b[1]) - scorePdf(a[0], a[1]))
            .slice(0, 8)
            .map(([url]) => url);
          if (onlySet && onlySet.size === 1) {
            console.log(`[${dId}] pdfCandidates (${pdfCandidates.size}):`, [...pdfCandidates.entries()]);
            console.log(`[${dId}] selected pdfUrls:`, pdfUrls);
          }
          await mapLimit(pdfUrls, 2, async (pdfUrl) => {
            const buf = await fetchPdfBuffer(pdfUrl, 25000);
            if (!buf) return;
            try {
              const parsedPdf = await Promise.race([
                pdfParse(buf, { max: 20 }),
                new Promise<null>((r) => setTimeout(() => r(null), 8000)),
              ]);
              if (parsedPdf?.text && parsedPdf.text.length > 150) {
                const pdfRows = parsePdfDirectoryText(parsedPdf.text, pdfUrl, normalizeEmail);
                if (onlySet && onlySet.size === 1) console.log(`[${dId}] PDF ${pdfUrl} -> ${pdfRows.length} rows`);
                allRows.push(...pdfRows);
              } else if (onlySet && onlySet.size === 1) {
                console.log(`[${dId}] PDF ${pdfUrl} parsed len=${parsedPdf?.text?.length || 0}`);
              }
            } catch {}
          });
        }

        // Scrub synthetic placeholders, glued emails, mis-split STDs, and Devanagari in *_en before matching
        cleanDistrictOffices(dId, dEntry, distData);

        // Classify all scraped rows
        const classified = allRows.map((row) => ({ row, ...classifyRowRole(row) }));

        // Track existing unique phones across this district to satisfy validate-data no-duplicate-phone rule
        const usedPhones = new Set<string>();
        for (const off of distData.offices) {
          for (const p of off.phones || []) {
            usedPhones.add(p.number.replace(/\s+/g, ""));
          }
        }

        const applyRowToOffice = (off: any, row: ParsedRow) => {
          off.source_url = row.url;
          off.valid_as_of = TODAY;
          if (row.phones.length > 0) off.confidence = "high";

          if (isCleanName(row.name) && (!off.officer_name_en || /^(DM|CDO|DPRO|SDM)\b/i.test(off.officer_name_en))) {
            off.officer_name_en = row.name;
            metrics.officesNameUpdated++;
          }
          if (row.email && VALID_EMAIL_RE.test(row.email)) {
            const isPlaceholderGmail = /^(?:bdo|sdm)\.[a-z0-9-]+\.[a-z0-9-]+@gmail\.com$/i.test(off.email || "");
            const isMalformedExisting = !off.email || !VALID_EMAIL_RE.test(off.email);
            if (isMalformedExisting || (isPlaceholderGmail && row.email !== off.email)) {
              off.email = row.email;
              metrics.officesEmailUpdated++;
            }
          }
          if (row.address && !off.address_en) {
            off.address_en = row.address;
          }
          if (row.phones.length > 0) {
            off.phones = off.phones || [];
            const existSet = new Set(off.phones.map((p: any) => p.number.replace(/\s+/g, "")));
            for (const num of row.phones) {
              if (!phoneRegex.test(num)) continue;
              if (!existSet.has(num) && !usedPhones.has(num)) {
                off.phones.push({
                  number: num,
                  type: num.includes("-") ? "landline" : "office",
                  source_url: row.url,
                  checked_on: TODAY,
                  status: "verified",
                });
                existSet.add(num);
                usedPhones.add(num);
                metrics.officesPhoneAdded++;
              }
            }
          }
        };

        // Match classified rows against existing offices
        for (const off of distData.offices) {
          const role = off.role;
          if (role === "dm" || role === "cdo" || role === "dpro" || role === "commissioner") {
            const matches = classified.filter((c) => c.role === role);
            // Prefer row with phones, or name, or email
            matches.sort((a, b) => (b.row.phones.length - a.row.phones.length) || (b.row.email ? 1 : 0) - (a.row.email ? 1 : 0));
            for (const m of matches) {
              applyRowToOffice(off, m.row);
              if (off.phones.length > 0 && off.email && off.officer_name_en) break;
            }
          } else if (role === "sdm" || role === "bdo" || role === "eo") {
            const targetKey = (off.covers?.[0] || off.office_name_en || "")
              .replace(/^up-[^-]+-(?:sdm|bdo|eo)-/, "")
              .replace(/^ulb-/, "")
              .replace(/-main$/, "");
            const extraAliases = role === "eo" ? HQ_TOWN_ALIASES[dId] || [] : [];
            const matches = classified.filter(
              (c) =>
                (c.role === role || (role === "eo" && /nagar|palika|panchayat|\be\.?o\.?\b|executive officer/i.test(c.haystack))) &&
                fuzzyPlaceMatch(targetKey, c.haystack, extraAliases)
            );
            const isJoint = (s: string) => /joint|संयुक्त|अतिरिक्त|addl/i.test(s) ? 1 : 0;
            matches.sort(
              (a, b) =>
                isJoint(a.haystack) - isJoint(b.haystack) ||
                b.row.phones.length - a.row.phones.length ||
                (b.row.email ? 1 : 0) - (a.row.email ? 1 : 0)
            );
            for (const m of matches) {
              applyRowToOffice(off, m.row);
              if (off.phones.length > 0 && off.email) break;
            }
          }
        }

        // Merge Municipal Corporation (Nagar Nigam Commissioner) from localbodies.up.nic.in if applicable
        const nn = nnMap.get(dId);
        if (nn) {
          let commOff = distData.offices.find((o: any) => o.role === "commissioner");
          if (!commOff) {
            commOff = {
              id: `up-${dId}-commissioner`,
              level: "ulb",
              role: "commissioner",
              office_name_en: `Municipal Commissioner, ${dEntry.name_en} Nagar Nigam`,
              office_name_hi: `नगर आयुक्त, ${dEntry.name_hi} नगर निगम`,
              phones: [],
              covers: [dId],
              source_url: "https://localbodies.up.nic.in/listnn.htm",
              confidence: "high",
              valid_as_of: TODAY,
            };
            distData.offices.push(commOff);
            metrics.commissionersAdded++;
          }
          if (nn.commEmail && !commOff.email) {
            commOff.email = nn.commEmail;
            metrics.officesEmailUpdated++;
          }
          if (nn.commName && !commOff.officer_name_en) {
            commOff.officer_name_en = nn.commName;
          }
          for (const num of nn.commPhones) {
            const clean = num.replace(/\s+/g, "");
            if (phoneRegex.test(clean) && !usedPhones.has(clean)) {
              commOff.phones.push({
                number: clean,
                type: clean.includes("-") ? "landline" : "cug",
                source_url: "https://localbodies.up.nic.in/listnn.htm",
                checked_on: TODAY,
                status: "verified",
              });
              usedPhones.add(clean);
              metrics.officesPhoneAdded++;
            }
          }
        }

        // Verified direct-portal supplement for Ambedkar Nagar CDO (ambedkarnagar.nic.in/en/notice/shri-vaibhav-mishra/)
        if (dId === "ambedkar-nagar") {
          const ambCdo = distData.offices.find((o: any) => o.role === "cdo");
          if (ambCdo && ambCdo.phones.length === 0 && !usedPhones.has("9454465295")) {
            ambCdo.officer_name_en = "Shri Vaibhav Mishra, IAS";
            ambCdo.email = "drda-amd@nic.in";
            ambCdo.source_url = "https://ambedkarnagar.nic.in/en/notice/shri-vaibhav-mishra/";
            ambCdo.valid_as_of = TODAY;
            ambCdo.phones.push({
              number: "9454465295",
              type: "cug",
              source_url: "https://ambedkarnagar.nic.in/en/notice/shri-vaibhav-mishra/",
              checked_on: TODAY,
              status: "verified",
            });
            usedPhones.add("9454465295");
            metrics.officesPhoneAdded++;
          }
        }

        // Verified Bareilly Nov 2026 Telephone Directory PDF (bareilly.nic.in/imp-phone-number/ -> 17951661203410.pdf)
        if (dId === "bareilly") {
          const blyPdfUrl = "https://cdn.s3waas.gov.in/s31d7f7abc18fcb43975065399b0d1e48e/uploads/2026/11/17951661203410.pdf";
          const blyMap: Record<string, { num: string; name: string }> = {
            baheri: { num: "9454464645", name: "Shri Vijay Kant Mishra" },
            shergarh: { num: "9454464647", name: "Shri Anand Vijay Yadav" },
            damkhoda: { num: "9454464648", name: "Shri Rohit Kumar" },
            bhojipura: { num: "9454464649", name: "Shri Vijay Kant Mishra (Addl. Charge)" },
            "fatehganj-west": { num: "9454464650", name: "Shri Harshit Kumar Singh" },
            mirganj: { num: "9454464651", name: "Shri Anand Vijay Yadav (Addl. Charge)" },
            kyara: { num: "9454464652", name: "Dr. Rajesh Kumar Yadav (Addl. Charge)" },
            ramnagar: { num: "9454464653", name: "Shri Bhagwan Das (Addl. Charge)" },
            majhgawan: { num: "9454464654", name: "Shri Bhagwan Das" },
            "alampur-jafarabad": { num: "9454464655", name: "Shri Harshit Kumar Singh (Addl. Charge)" },
            "bithari-chainpur": { num: "9454464656", name: "Smt. Aarti Jaiswal (Addl. Charge)" },
            nawabganj: { num: "9454464657", name: "Shri Mahesh Chandra Shakya" },
            bhadpura: { num: "9454464658", name: "Ms. Isha Harshita" },
            bhuta: { num: "9454464659", name: "Shri Arjun Kumar (Addl. Charge)" },
            faridpur: { num: "9454464660", name: "Shri Jitendra Kumar (Addl. Charge)" },
          };
          for (const off of distData.offices) {
            if (off.role !== "bdo") continue;
            const blk = off.covers?.[0] || "";
            const hit =
              blyMap[blk] ||
              Object.entries(blyMap).find(([k]) => fuzzyPlaceMatch(k, blk))?.[1];
            if (hit && !usedPhones.has(hit.num)) {
              off.officer_name_en = hit.name;
              off.source_url = blyPdfUrl;
              off.valid_as_of = TODAY;
              off.phones.push({
                number: hit.num,
                type: "cug",
                source_url: blyPdfUrl,
                checked_on: TODAY,
                status: "verified",
              });
              usedPhones.add(hit.num);
              metrics.officesPhoneAdded++;
            }
          }
        }

        const EO_GARBAGE_RE =
          /\b(mobail|mobile|number|nambar|phone|atirikt|prabhari|fishery|fisheries|bima|yojana|yojna|karmachari|nideshak|panchayaten|palika$|parishad$|website|sanitary|safai|abhiyanta|engineer|lekhpal|collectorate|vikas\s*bhawan|tehsil|block|municipalities|dios|dio|di\.ai\.o|di0ai|adeo|rajistrar|registrar|kaushal|lekhapariksha|shram)\b/i;

        // Prune any previously harvested non-main EOs that are non-civic, malformed, or contain leftover Devanagari chars in EN
        distData.offices = distData.offices.filter((o: any) => {
          if (o.role !== "eo" || o.id.endsWith("-main")) return true;
          if (EO_GARBAGE_RE.test(`${o.id} ${o.office_name_en}`)) return false;
          if (/[\u0900-\u097f]/.test(o.office_name_en || "")) return false;
          if (MOJIBAKE_RE.test(`${o.office_name_en || ""} ${o.office_name_hi || ""}`)) return false;
          if (/^up-[a-z-]+-eo-(?:eo|\d+|executive-officer)-/i.test(o.id)) return false;
          return true;
        });

        const ownerByPhone = new Map<string, string>();
        for (const o of distData.offices) {
          for (const p of o.phones || []) {
            if (p?.number && !ownerByPhone.has(p.number)) {
              ownerByPhone.set(p.number, o.id);
            }
          }
        }

        // Add individual verified Town / ULB EOs discovered on S3WaaS municipality cards/tables
        const existingEoEntries: Array<{ isMain: boolean; text: string; email: string }> = distData.offices
          .filter((o: any) => o.role === "eo" || o.role === "commissioner")
          .map((o: any) => ({
            isMain: o.id.endsWith("-main"),
            text: `${o.office_name_en} ${o.office_name_hi || ""}`,
            email: o.email || "",
          }));
        for (const c of classified) {
          if (c.role !== "eo") continue;
          const validEmail = VALID_EMAIL_RE.test(c.row.email || "") ? c.row.email : "";
          const hasActionable = c.row.phones.length > 0 || /\.(?:nic|gov)\.in$/i.test(validEmail);
          if (!hasActionable) continue;
          let stripped = (c.row.designation || "").trim();
          for (let pass = 0; pass < 3; pass++) {
            stripped = stripped
              .replace(/^(?:executive\s*officer|e\.?\s*o\.?|अधिशासी\s*अधिकारी|ई०?\s*ओ०?)\s*[,:\-–/&]*\s*/iu, "")
              .trim();
          }
          const hasDev = /[\u0900-\u097f]/.test(stripped);
          const enPlaceRaw = (hasDev ? devanagariToLatin(stripped) : stripped).replace(/[\u0900-\u097f]/g, "").trim();
          if (/\bnigam\b/i.test(enPlaceRaw) || EO_GARBAGE_RE.test(enPlaceRaw)) {
            continue;
          }
          const cleanedPlaceWords = enPlaceRaw
            .toLowerCase()
            .replace(/\b(executive|officer|adhishasi|adhishashi|adhikari|nagar|palika|parishad|prishad|parishd|panchayat|np|npp|municipal|corporation|council|town|area|eo)\b/g, " ")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
          const slug = cleanedPlaceWords
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          if (!slug || slug.length < 3 || slug.length > 48) continue;
          if (/^(?:mobail|nambar|atirikt|prabhari|panchayaten|palika|parishad|panchayat|nagar|town|unknown)$/i.test(slug)) {
            continue;
          }
          // Skip if already represented on main EO / Commissioner or matching ULB entry
          if (
            existingEoEntries.some(
              (e) => fuzzyPlaceMatch(slug, e.text) || (e.isMain && validEmail && e.email === validEmail)
            )
          ) {
            continue;
          }
          const newId = `up-${dId}-eo-${slug}`;
          if (distData.offices.some((o: any) => o.id === newId)) continue;
          const newPhones = c.row.phones
            .filter((num) => phoneRegex.test(num) && !usedPhones.has(num))
            .map((num) => {
              usedPhones.add(num);
              ownerByPhone.set(num, newId);
              metrics.officesPhoneAdded++;
              return {
                number: num,
                type: num.includes("-") ? "landline" : "office",
                source_url: c.row.url,
                checked_on: TODAY,
                status: "verified",
              };
            });
          const sharedFallbackId =
            newPhones.length === 0
              ? c.row.phones.map((num) => ownerByPhone.get(num)).find((id) => id && id !== newId)
              : undefined;
          if (newPhones.length === 0 && !validEmail && !sharedFallbackId) continue;
          const titleCaseEn = enPlaceRaw
            .replace(/\b[a-z]/g, (ch) => ch.toUpperCase())
            .replace(/\s+/g, " ")
            .trim();
          distData.offices.push({
            id: newId,
            level: "ulb",
            role: "eo",
            office_name_en: `Executive Officer, ${titleCaseEn}`,
            office_name_hi: `अधिशासी अधिकारी, ${stripped}`,
            ...(isCleanName(c.row.name) ? { officer_name_en: c.row.name } : {}),
            phones: newPhones,
            ...(validEmail ? { email: validEmail } : {}),
            ...(sharedFallbackId
              ? {
                  post_status: "additional_charge",
                  fallback_office_id: sharedFallbackId,
                  notes: "Joint additional charge; primary CUG/landline is listed on the linked fallback office.",
                }
              : {}),
            covers: [`ulb-${slug}`],
            source_url: c.row.url,
            confidence: newPhones.length > 0 ? "high" : "medium",
            valid_as_of: TODAY,
          });
          existingEoEntries.push({ isMain: false, text: `${titleCaseEn} ${stripped}`, email: validEmail });
        }

        // Link ADO (Panchayat) offices without dedicated CUG numbers to their supervising Block BDO office
        const bdoByBlock = new Map<string, string>();
        for (const o of distData.offices) {
          if (o.role === "bdo" && o.covers?.[0]) bdoByBlock.set(o.covers[0], o.id);
        }
        for (const o of distData.offices) {
          if (o.role === "ado_panchayat" && (!o.phones || o.phones.length === 0) && !o.fallback_office_id) {
            const supBdo = o.covers?.[0] ? bdoByBlock.get(o.covers[0]) : undefined;
            if (supBdo) o.fallback_office_id = supBdo;
          }
        }

        // Run final hygiene pass so newly added rows never introduce Devanagari in *_en or mixed English in *_hi
        cleanDistrictOffices(dId, dEntry, distData);

        distData.verified_on = TODAY;
        fs.writeFileSync(distFile, JSON.stringify(distData, null, 2) + "\n", "utf-8");
        updateDistrictCoverageMetrics(dEntry, distData);
        metrics.districtsProcessed++;
      })
    );
    process.stdout.write(`Harvested ${Math.min(i + batchSize, targetDistricts.length)}/${targetDistricts.length} districts\r`);
  }
  if (onlySet && process.env.UPDATE_INDEX !== "true") {
    console.log(`\n[ONLY_DISTRICT=${onlyDist}] Metrics:`, metrics);
    return;
  }

  fs.writeFileSync(path.join(DATA_DIR, "districts.json"), JSON.stringify(districtsIndex, null, 2) + "\n", "utf-8");
  console.log("\n=== Statewide Multi-Source Harvest Complete ===");
  console.log(metrics);
}

// Recompute verified coverage tiers strictly from verified phones and verified official emails
// (never fallback_office_id or synthetic @gmail.com placeholders)
function isVerifiedOfficialContact(o: any): boolean {
  const hasVerifiedPhone =
    Array.isArray(o.phones) && o.phones.some((p: any) => p && p.status === "verified" && phoneRegex.test(String(p.number || "").replace(/\s+/g, "")));
  const em = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  const isOfficialEmail =
    Boolean(em) &&
    VALID_EMAIL_RE.test(em) &&
    !SYNTHETIC_GMAIL_RE.test(em) &&
    (/\.(?:nic|gov)\.in$/i.test(em) || o.role === "commissioner" || o.role === "eo");
  return hasVerifiedPhone || isOfficialEmail;
}

function updateDistrictCoverageMetrics(distEntry: any, distData: any) {
  const offices: any[] = distData.offices || [];
  const tier0 = offices.filter((o) => ["dm", "cdo", "dpro", "commissioner"].includes(o.role));
  const tier1 = offices.filter((o) => ["sdm", "bdo", "eo", "tehsildar"].includes(o.role));
  const pct = (arr: any[], predicate: (x: any) => boolean) =>
    arr.length === 0 ? 100 : Math.round((arr.filter(predicate).length / arr.length) * 100);

  const t0Pct = pct(tier0, isVerifiedOfficialContact);
  const t1Pct = pct(tier1, isVerifiedOfficialContact);
  const hasPlaces = fs.existsSync(path.join(DATA_DIR, "places", `${distEntry.id}.json`));
  const t2Pct = hasPlaces ? 100 : 0;

  const verifiedCount = offices.filter(isVerifiedOfficialContact).length;

  distEntry.coverage = {
    tier0: t0Pct,
    tier1: t1Pct,
    tier2: t2Pct,
    verified_pct: offices.length > 0 ? Math.round((verifiedCount / offices.length) * 100) : 0,
    last_verified: TODAY,
  };
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
