import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { phoneRegex } from "../lib/validate";
import { parsePdfDirectoryText } from "./lib/pdf-directory";

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

function normalizeEmail(raw: string): string {
  const cleaned = (raw || "")
    .replace(/\be-?mail\s*[:\-]\s*/gi, " ")
    .replace(/\s*[\[\(\{\]]\s*at\s*[\]\)\}\[]\s*/gi, "@")
    .replace(/\s*[\[\(\{\]]\s*dot\s*[\]\)\}\[]\s*/gi, ".")
    .replace(/\s*[\[\(\{\]]\s*(?:hyphen|dash)\s*[\]\)\}\[]\s*/gi, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const candidates = cleaned.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.(?:gov\.in|nic\.in|ac\.in|co\.in|res\.in|ernet\.in|org\.in|com|org|net|in|edu)(?=\s|$|[,;|)<"'\]])/g
  );
  if (!candidates || candidates.length === 0) return "";
  return candidates.find((e) => /\.(?:nic|gov)\.in$/.test(e)) || candidates[0];
}

function extractPhones(raw: string, stdHint?: string): string[] {
  const results = new Set<string>();
  const clean = (raw || "").replace(/&#8211;|&ndash;/g, "-");

  // 10-digit mobiles starting 6-9
  for (const m of clean.matchAll(/(?:\+?91[\s-]*)?\b0?([6-9]\d{9})\b/g)) {
    results.add(m[1]);
  }
  // Explicit STD-landline e.g. 0522-2623024 or 0522 2623024
  for (const m of clean.matchAll(/\b(0\d{2,4})[\s-]+(\d{6,8})\b/g)) {
    const formatted = `${m[1]}-${m[2]}`;
    if (phoneRegex.test(formatted)) results.add(formatted);
  }
  // 11-digit starting 0
  for (const m of clean.matchAll(/\b(0\d{2,4})(\d{6,7})\b/g)) {
    const formatted = `${m[1]}-${m[2]}`;
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
  "sarojini-nagar": ["sarojininagar", "sarojninagar"],
  "gosainganj": ["gosaiganj"],
  "aliya": ["ailiya", "ailya", "aeli"],
  "madhogarh": ["nmadhogarh"],
  "kashi-vidya-pith": ["kashividyapith", "vidyapith"],
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
  "toderpur": ["tondarpur"],
  "sarbankhera": ["sarvankheda", "sarvankhera"],
  "ikouna": ["ikauna"],
};

const DEV_VOWELS: Record<string, string> = {
  अ: "a", आ: "a", इ: "i", ई: "i", उ: "u", ऊ: "u",
  ऋ: "ri", ए: "e", ऐ: "ai", ओ: "o", औ: "au", ऑ: "o", ऍ: "e",
};
const DEV_VOWEL_MATRAS: Record<string, string> = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
  "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o", "ॅ": "e",
};
const DEV_SIGNS: Record<string, string> = { "ं": "n", "ँ": "n", "ः": "h" };
const DEV_CONS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n",
  च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
  त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "ph", ब: "b", भ: "bh", म: "m",
  य: "y", र: "r", ल: "l", व: "v", श: "sh",
  ष: "sh", स: "s", ह: "h",
  क़: "q", ख़: "kh", ग़: "g", ज़: "z", ड़: "r", ढ़: "rh", फ़: "f",
};

function devanagariToLatin(text: string): string {
  const clean = (text || "").replace(/\u093c/g, "");
  let out = "";
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch in DEV_VOWELS) {
      out += DEV_VOWELS[ch];
    } else if (ch in DEV_VOWEL_MATRAS) {
      out += DEV_VOWEL_MATRAS[ch];
    } else if (ch in DEV_SIGNS) {
      out += DEV_SIGNS[ch];
    } else if (ch === "्") {
      // Virama consumed by preceding consonant
    } else if (ch in DEV_CONS) {
      out += DEV_CONS[ch];
      const next = clean[i + 1];
      if (next === "्") {
        i++;
      } else if (next && next in DEV_VOWEL_MATRAS) {
        // Explicit vowel matra supplies vowel
      } else if (next && /[\u0900-\u097f]/.test(next)) {
        out += "a";
      }
    } else {
      out += ch;
    }
  }
  return out;
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

function classifyRowRole(row: ParsedRow): {
  role: "dm" | "cdo" | "dpro" | "sdm" | "bdo" | "eo" | "commissioner" | null;
  haystack: string;
} {
  const hay = `${row.designation} ${row.address} ${row.rawText}`.trim();
  const low = hay.toLowerCase();

  // Exclude clearly non-civic / former / deputy / additional posts for district heads
  if (/\b(former|ex[\s-]*dm|sp|superintendent of police|ssp|cmo|chief medical|bsa|basic shiksha|dioc|judge|advocate|fire|excise|aabkari|treasury)\b/i.test(low) || /अपर|सहायक|उप मुख्य|पुलिस अधीक्षक/.test(low)) {
    // Allow उपजिलाधिकारी / सहायक? No, keep अपर as exclusion for DM/CDO/DPRO
  }

  const isExcludedHead = /\b(former|ex[\s-]*dm|additional|addl|adm\b|city magistrate|sub[\s-]*divisional|s[\s.-]*d[\s.-]*m\b|dy|deputy|asst|assistant|ddo)\b/i.test(low) || /अपर\s|सहायक\s|उप\s*जिला/.test(low);

  if (/\b(former|ex[\s-]*dm|sp|superintendent of police|ssp|cmo|chief medical|bsa|basic shiksha|dioc|judge|advocate|fire|excise|aabkari|treasury)\b/i.test(low) || /पुलिस अधीक्षक|मुख्य चिकित्सा|जिला विद्यालय/.test(low)) {
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
    (/\bexecutive officer\b/i.test(low) || /अधिशासी अधिकारी/.test(low)) &&
    !/\b(chief executive|executive engineer|sub[\s-]*divisional|fishery|fisheries|bima|yojana|ado|ceo)\b/i.test(low) &&
    !/अभियन्ता|मत्स्य|उप\s*जिलाधिकारी|बीमा|योजना/.test(low)
  ) {
    return { role: "eo", haystack: hay };
  }
  // Sub-Divisional Magistrate
  if (/\b(sub[\s-]*divisional magistrate|s[\s.-]*d[\s.-]*m\.?|sub[\s-]*divisional officer)\b/i.test(low) || /उप\s*जिलाधिकारी|उपजिलाधिकारी|एस०?डी०?एम/.test(low)) {
    return { role: "sdm", haystack: hay };
  }
  // Block Development Officer
  if ((/\b(block development officer|b\.?d\.?o\.?)\b/i.test(low) || /खंड विकास अधिकारी|खण्ड विकास अधिकारी|बी०?डी०?ओ/.test(low)) && !/\b(ado|assistant|asst|beo)\b/i.test(low) && !/सहायक|शिक्षा/.test(low)) {
    return { role: "bdo", haystack: hay };
  }
  // Remaining ULB E.O. shorthand
  if (
    /\be\.?o\.?\b/i.test(low) &&
    !/\b(chief executive|executive engineer|fishery|fisheries|bima|yojana|ado|ceo|cdo|dpro|bdo|beo|sdo)\b/i.test(low) &&
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
    const commCell = cells[4] || "";
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

async function run() {
  console.log("🚀 Starting UP Statewide Official Multi-Source Harvester...");
  const districtsIndex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "districts.json"), "utf8"));

  // 1. Fetch UP S3WaaS Master District URL list
  const s3Urls = new Map<string, string>();
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

  // 2. Fetch 17 Municipal Corporations from localbodies.up.nic.in
  const nnMap = await harvestStateNagarNigams();
  console.log(`🏛️ Loaded ${nnMap.size}/17 Municipal Corporations from localbodies.up.nic.in`);

  const commonPaths = [
    "/about-district/whos-who/",
    "/who-is-who/",
    "/whos-who/",
    "/hi/whos-who/",
    "/hi/about-district/whos-who/",
    "/hi/who-is-who/",
    "/officers-phones/",
    "/contact-directory/",
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
    "/imp-phone-number/",
    "/directory/",
    "/hi/directory/",
    "/telephone/",
    "/contact-us/",
    "/tehsil/",
    "/subdivision-blocks/",
    "/block-details/",
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
    "/urban-local-bodies/",
    "/local-bodies/",
    "/municipalities/",
    "/nagar-palika-parishad/",
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
  const targetDistricts = onlyDist ? districtsIndex.filter((d: any) => d.id === onlyDist) : districtsIndex;
  const batchSize = 5;
  for (let i = 0; i < targetDistricts.length; i += batchSize) {
    const batch = targetDistricts.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (dEntry: any) => {
        const dId: string = dEntry.id;
        const distFile = path.join(DATA_DIR, "districts", `${dId}.json`);
        if (!fs.existsSync(distFile)) return;
        const distData = JSON.parse(fs.readFileSync(distFile, "utf8"));

        const normId = dId.replace(/[^a-z]/g, "");
        const normName = dEntry.name_en.toLowerCase().replace(/[^a-z]/g, "");
        const baseUrl = MANUAL_URL_MAP[dId] || s3Urls.get(normId) || s3Urls.get(normName) || `https://${normId}.nic.in`;

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

        const allRows: ParsedRow[] = [];
        const pdfCandidates = new Map<string, string>();
        const collectPdfs = (html: string, pageUrl: string) => {
          for (const pdf of extractDirectoryPdfs(html, pageUrl)) {
            if (!pdfCandidates.has(pdf.url)) pdfCandidates.set(pdf.url, pdf.label);
          }
        };
        if (home) collectPdfs(home.html, home.finalUrl);
        if (homeHi) collectPdfs(homeHi.html, homeHi.finalUrl);

        // Depth 1.5 + 2 crawl (115 initial + 45 depth2 / pagination pages)
        const toVisit = [...queue].slice(0, 115);
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
            for (const pgM of page.html.matchAll(/href=["']([^"']*\/page\/[2-8]\/?)["']/gi)) {
              try {
                const nextPg = new URL(pgM[1], page.finalUrl).href;
                if (!visited.has(nextPg)) depth2.add(nextPg);
              } catch {}
            }
          }
        });

        const d2List = [...depth2].slice(0, 45);
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
        if (onlyDist) {
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
              if (onlyDist) console.log(`[${dId}] PDF ${pdfUrl} -> ${pdfRows.length} rows`);
              allRows.push(...pdfRows);
            } else if (onlyDist) {
              console.log(`[${dId}] PDF ${pdfUrl} parsed len=${parsedPdf?.text?.length || 0}`);
            }
          } catch {}
        });

        // Scrub invalid emails and truncated "91xxxxxxxx" prefixes when the full 10-digit number is present on the same office
        for (const off of distData.offices) {
          if (off.email && !VALID_EMAIL_RE.test(off.email)) {
            delete off.email;
          }
          if (Array.isArray(off.phones) && off.phones.length > 1) {
            const nums = off.phones.map((p: any) => p.number.replace(/\s+/g, ""));
            off.phones = off.phones.filter((p: any) => {
              const n = p.number.replace(/\s+/g, "");
              if (/^91\d{8}$/.test(n)) {
                const prefix8 = n.slice(2);
                if (nums.some((other: string) => other !== n && other.startsWith(prefix8))) return false;
              }
              return true;
            });
          }
        }

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
          /\b(mobail|mobile|number|nambar|phone|atirikt|prabhari|fishery|fisheries|bima|yojana|yojna|karmachari|nideshak|panchayaten|palika$|parishad$|website|sanitary|safai|abhiyanta|engineer|lekhpal|collectorate|vikas\s*bhawan|tehsil|block|municipalities)\b/i;

        // Prune any previously harvested non-main EOs that are non-civic, malformed, or contain leftover Devanagari chars in EN
        distData.offices = distData.offices.filter((o: any) => {
          if (o.role !== "eo" || o.id.endsWith("-main")) return true;
          if (EO_GARBAGE_RE.test(`${o.id} ${o.office_name_en}`)) return false;
          if (/[\u0900-\u097f]/.test(o.office_name_en || "")) return false;
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

        distData.verified_on = TODAY;
        fs.writeFileSync(distFile, JSON.stringify(distData, null, 2) + "\n", "utf-8");
        updateDistrictCoverageMetrics(dEntry, distData);
        metrics.districtsProcessed++;
      })
    );
    process.stdout.write(`Harvested ${Math.min(i + batchSize, targetDistricts.length)}/${targetDistricts.length} districts\r`);
  }
  if (onlyDist) {
    console.log(`\n[ONLY_DISTRICT=${onlyDist}] Metrics:`, metrics);
    return;
  }

  fs.writeFileSync(path.join(DATA_DIR, "districts.json"), JSON.stringify(districtsIndex, null, 2) + "\n", "utf-8");
  console.log("\n=== Statewide Multi-Source Harvest Complete ===");
  console.log(metrics);
}

// Recompute verified coverage tiers cleanly on districts.json after harvest
function updateDistrictCoverageMetrics(distEntry: any, distData: any) {
  const offices: any[] = distData.offices || [];
  const tier0 = offices.filter((o) => ["dm", "cdo", "dpro", "commissioner"].includes(o.role));
  const tier1 = offices.filter((o) => ["sdm", "bdo", "eo", "tehsildar"].includes(o.role));
  const pct = (arr: any[], predicate: (x: any) => boolean) =>
    arr.length === 0 ? 100 : Math.round((arr.filter(predicate).length / arr.length) * 100);

  const t0Pct = pct(tier0, (o) => o.phones?.length > 0 || (o.email && o.email.includes("@")));
  const t1Pct = pct(tier1, (o) => o.phones?.length > 0 || (o.email && o.email.includes("@")));
  const hasPlaces = fs.existsSync(path.join(DATA_DIR, "places", `${distEntry.id}.json`));
  const t2Pct = hasPlaces ? 100 : 0;

  const phoneOrEmailCount = offices.filter(
    (o) => o.phones?.length > 0 || (o.email && o.email.includes("@")) || o.fallback_office_id
  ).length;

  distEntry.coverage = {
    tier0: t0Pct,
    tier1: t1Pct,
    tier2: t2Pct,
    verified_pct: offices.length > 0 ? Math.round((phoneOrEmailCount / offices.length) * 100) : 0,
    last_verified: TODAY,
  };
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
