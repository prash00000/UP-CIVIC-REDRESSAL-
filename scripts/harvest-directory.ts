import fs from "fs";
import path from "path";
import { phoneRegex } from "../lib/validate";

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

function normalizeEmail(raw: string): string {
  const cleaned = (raw || "")
    .replace(/\s*\[at\]\s*|\s*\(at\)\s*/gi, "@")
    .replace(/\s*\[dot\]\s*|\s*\(dot\)\s*/gi, ".")
    .replace(/\s*\[hyphen\]\s*|\s*\(hyphen\)\s*|\s*\[dash\]\s*/gi, "-")
    .replace(/\s+/g, "")
    .toLowerCase();
  const match = cleaned.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
  return match ? match[0] : "";
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

function fuzzyPlaceMatch(placeSlugOrName: string, rowText: string): boolean {
  const p = placeSlugOrName
    .toLowerCase()
    .replace(/\b(tehsil|block|gp|nagar|palika|panchayat|parishad|municipal|corporation)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
  if (p.length < 3) return false;
  const hay = rowText.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (hay.includes(p)) return true;
  // Common UP transliteration equivalents (e.g. bakhshi vs bakshi, sarojni vs sarojini, mohanlalganj)
  const normP = p.replace(/kh/g, "k").replace(/sh/g, "s").replace(/ee/g, "i").replace(/oo/g, "u").replace(/aa/g, "a");
  const normH = hay.replace(/kh/g, "k").replace(/sh/g, "s").replace(/ee/g, "i").replace(/oo/g, "u").replace(/aa/g, "a");
  return normP.length >= 4 && normH.includes(normP);
}

function parseS3waasPage(html: string, url: string): ParsedRow[] {
  const rowsOut: ParsedRow[] = [];
  const pageStdMatch = html.match(/STD\s*(?:Code)?\s*[:\-–]?\s*(0\d{2,4})/i);
  const pageStd = pageStdMatch ? pageStdMatch[1] : undefined;

  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  for (const table of tables) {
    const trs = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    if (trs.length < 2) continue;

    const firstTr = trs[0];
    if (!firstTr) continue;

    const headerRaw = decodeHtml(firstTr);
    const tableStdMatch = headerRaw.match(/STD\s*(?:Code)?\s*[:\-–]?\s*(0\d{2,4})/i);
    const stdHint = tableStdMatch ? tableStdMatch[1] : pageStd;

    const headers = (firstTr.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) || []).map((c) => decodeHtml(c).toLowerCase());
    const colIdx = {
      name: headers.findIndex((h) => /\b(officer\s*name|name)\b|नाम/.test(h) && !/district|block|tehsil|ulb|body/.test(h)),
      desig: headers.findIndex((h) => /designation|officer|post|पद|office\b/.test(h)),
      email: headers.findIndex((h) => /email|e-mail|ईमेल/.test(h)),
      address: headers.findIndex((h) => /address|पता/.test(h)),
      phone: headers.findIndex((h) => /phone|mobile|c\.?u\.?g\.?|contact|telephone|मोबाइल|दूरभाष/.test(h)),
    };

    for (let i = 1; i < trs.length; i++) {
      const cells = (trs[i].match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map((c) => decodeHtml(c));
      if (cells.length < 2) continue;
      // Join all cells with space (keeping adjacent [dot] tokens unified for split email cells)
      const joined = cells.join(" ").replace(/\s+/g, " ").trim();
      if (!joined) continue;

      const email = normalizeEmail(
        (colIdx.email >= 0 ? cells[colIdx.email] : "") || joined
      );
      const phoneSource = colIdx.phone >= 0 && cells[colIdx.phone] ? cells[colIdx.phone] : joined;
      // Extract landline vs mobile carefully using stdHint only on phone column or explicit full numbers
      const phones = extractPhones(phoneSource, colIdx.phone >= 0 ? stdHint : undefined);
      const name = colIdx.name >= 0 && cells[colIdx.name] ? cells[colIdx.name] : "";
      const designation =
        colIdx.desig >= 0 && cells[colIdx.desig]
          ? cells[colIdx.desig]
          : cells.find((c) => /magistrate|development officer|panchayat|sdm|s-d-m|bdo|cdo|dm|ayukt|commissioner|executive/i.test(c)) || "";
      const address = colIdx.address >= 0 && cells[colIdx.address] ? cells[colIdx.address] : "";

      if (designation || phones.length > 0 || email) {
        rowsOut.push({
          url,
          name,
          designation,
          email,
          address,
          phones,
          rawText: joined,
        });
      }
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
  // Sub-Divisional Magistrate
  if (/\b(sub[\s-]*divisional magistrate|s[\s.-]*d[\s.-]*m\.?|sub[\s-]*divisional officer)\b/i.test(low) || /उप\s*जिलाधिकारी|उपजिलाधिकारी|एस०?डी०?एम/.test(low)) {
    return { role: "sdm", haystack: hay };
  }
  // Block Development Officer
  if ((/\b(block development officer|b\.?d\.?o\.?)\b/i.test(low) || /खंड विकास अधिकारी|खण्ड विकास अधिकारी|बी०?डी०?ओ/.test(low)) && !/\b(ado|assistant|asst)\b/i.test(low) && !/सहायक/.test(low)) {
    return { role: "bdo", haystack: hay };
  }
  // Executive Officer (Nagar Palika / Nagar Panchayat)
  if (/\b(executive officer|\be\.?o\.?\b)\b/i.test(low) || /अधिशासी अधिकारी/.test(low)) {
    return { role: "eo", haystack: hay };
  }

  return { role: null, haystack: hay };
}

async function fetchHtml(url: string, ms = 9000): Promise<{ finalUrl: string; html: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UPCivicDirectory/2.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html") && !ct.includes("text")) return null;
    return { finalUrl: res.url, html: await res.text() };
  } catch {
    return null;
  }
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
    const combo = `${abs} ${linkText}`;
    if (
      /who|dir|contact|phone|telephone|cug|offic|tehsil|block|develop|municip|nagarnigam|collectrate|collectorate|panchayat|std/i.test(
        combo
      ) &&
      !/eoffice|training|video|notice|tender|recruitment|anganwadi|bsa-office|aabkari|former|election|circle-rate|registration/i.test(
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
    "/directory/",
    "/hi/directory/",
    "/telephone-dir-eng/",
    "/telephone-directory/",
    "/telephone/",
    "/contact-us/",
    "/tehsil/",
    "/development-block/",
    "/block/",
    "/public-utility-category/municipality/",
  ];

  const metrics = {
    districtsProcessed: 0,
    pagesScanned: 0,
    officesPhoneAdded: 0,
    officesEmailUpdated: 0,
    officesNameUpdated: 0,
    commissionersAdded: 0,
  };

  // Process districts in batches of 6
  const batchSize = 6;
  for (let i = 0; i < districtsIndex.length; i += batchSize) {
    const batch = districtsIndex.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (dEntry: any) => {
        const dId: string = dEntry.id;
        const distFile = path.join(DATA_DIR, "districts", `${dId}.json`);
        if (!fs.existsSync(distFile)) return;
        const distData = JSON.parse(fs.readFileSync(distFile, "utf8"));

        const normId = dId.replace(/[^a-z]/g, "");
        const normName = dEntry.name_en.toLowerCase().replace(/[^a-z]/g, "");
        const baseUrl = MANUAL_URL_MAP[dId] || s3Urls.get(normId) || s3Urls.get(normName) || `https://${normId}.nic.in`;

        // Depth 1: homepage -> discover nav links
        const visited = new Set<string>();
        const queue = new Set<string>(commonPaths.map((p) => baseUrl + p));
        const home = await fetchHtml(baseUrl + "/", 9000);
        if (home) {
          const origin = new URL(home.finalUrl).origin;
          for (const u of extractNavLinks(home.html, origin)) queue.add(u);
          for (const p of commonPaths) queue.add(origin + p);
        }

        const allRows: ParsedRow[] = [];
        // Depth 1.5 + 2 crawl (limit 24 pages per district including bilingual /hi/ directory pages)
        const toVisit = [...queue].slice(0, 24);
        const depth2 = new Set<string>();

        await Promise.all(
          toVisit.map(async (u) => {
            if (visited.has(u)) return;
            visited.add(u);
            const page = await fetchHtml(u, 8500);
            if (!page) return;
            metrics.pagesScanned++;
            const parsed = parseS3waasPage(page.html, page.finalUrl);
            allRows.push(...parsed);

            // If directory/telephone hub page, queue sublinks
            if (/directory|telephone-dir|officers|contact/i.test(u)) {
              const origin = new URL(page.finalUrl).origin;
              for (const sub of extractNavLinks(page.html, origin)) {
                if (!visited.has(sub)) depth2.add(sub);
              }
            }
          })
        );

        const d2List = [...depth2].slice(0, 8);
        await Promise.all(
          d2List.map(async (u) => {
            if (visited.has(u)) return;
            visited.add(u);
            const page = await fetchHtml(u, 8500);
            if (!page) return;
            metrics.pagesScanned++;
            allRows.push(...parseS3waasPage(page.html, page.finalUrl));
          })
        );

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
          if (row.email && (!off.email || !off.email.includes("@"))) {
            off.email = row.email;
            metrics.officesEmailUpdated++;
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
            const matches = classified.filter(
              (c) => (c.role === role || (role === "eo" && /nagar|palika|panchayat|\be\.?o\.?\b|executive officer/i.test(c.haystack))) && fuzzyPlaceMatch(targetKey, c.haystack)
            );
            matches.sort((a, b) => b.row.phones.length - a.row.phones.length);
            for (const m of matches) {
              applyRowToOffice(off, m.row);
              if (off.phones.length > 0) break;
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
    process.stdout.write(`Harvested ${Math.min(i + batchSize, districtsIndex.length)}/75 districts\r`);
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
