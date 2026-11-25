import fs from "fs";
import path from "path";
import { phoneRegex } from "../lib/validate";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const TODAY = "2026-11-25";

interface ParsedContact {
  name: string;
  designation: string;
  email: string;
  address: string;
  phones: string[];
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .replace(/&#8211;|&ndash;/gi, "-")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(raw: string): string {
  const cleaned = raw
    .replace(/\[at\]|\(at\)/gi, "@")
    .replace(/\[dot\]|\(dot\)/gi, ".")
    .replace(/\s+/g, "")
    .toLowerCase();
  const match = cleaned.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
  return match ? match[0] : "";
}

function normalizePhones(raw: string): string[] {
  const results = new Set<string>();
  // Split on common delimiters
  const parts = raw.split(/[,;/|\n]+/);
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    // Strip +91 prefix
    part = part.replace(/^\+?91[\s-]*/, "");
    // Check 10-digit mobile
    const digitsOnly = part.replace(/[^\d]/g, "");
    if (/^[6-9]\d{9}$/.test(digitsOnly)) {
      results.add(digitsOnly);
      continue;
    }
    // Check STD landline like 0522-2623912 or 0522 2623912
    const stdMatch = part.match(/\b(0\d{2,4})[\s-]+(\d{6,8})\b/);
    if (stdMatch) {
      const formatted = `${stdMatch[1]}-${stdMatch[2]}`;
      if (phoneRegex.test(formatted)) {
        results.add(formatted);
        continue;
      }
    }
    // Sometimes 11 digits starting with 0 (e.g., 05222623912)
    if (/^0\d{9,10}$/.test(digitsOnly)) {
      const formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
      if (phoneRegex.test(formatted)) {
        results.add(formatted);
      }
    }
  }
  return [...results];
}

function parseS3waasTables(html: string): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];

  for (const table of tables) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    if (rows.length < 2) continue;

    const headerRow = rows[0];
    if (!headerRow) continue;

    // Detect header columns
    const headerCells = (headerRow.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) || []).map((c) =>
      decodeHtml(c).toLowerCase()
    );

    const colIdx = {
      name: headerCells.findIndex((h) => /\bname\b|officer|नाम/.test(h)),
      desig: headerCells.findIndex((h) => /designation|post|पद/.test(h)),
      email: headerCells.findIndex((h) => /email|e-mail|ईमेल/.test(h)),
      address: headerCells.findIndex((h) => /address|office|पता/.test(h)),
      phone: headerCells.findIndex((h) => /phone|mobile|contact|telephone|std|दूरभाष/.test(h)),
    };

    if (colIdx.desig === -1 && colIdx.name === -1) continue;

    for (let i = 1; i < rows.length; i++) {
      const cells = (rows[i].match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map((c) => decodeHtml(c));
      if (cells.length < 2) continue;

      const name = colIdx.name >= 0 && cells[colIdx.name] ? cells[colIdx.name] : "";
      const designation = colIdx.desig >= 0 && cells[colIdx.desig] ? cells[colIdx.desig] : "";
      const emailRaw = colIdx.email >= 0 && cells[colIdx.email] ? cells[colIdx.email] : "";
      const address = colIdx.address >= 0 && cells[colIdx.address] ? cells[colIdx.address] : "";
      const phoneRaw = colIdx.phone >= 0 && cells[colIdx.phone] ? cells[colIdx.phone] : "";

      const email = normalizeEmail(emailRaw || cells.join(" "));
      const phones = normalizePhones(phoneRaw || cells.join(", "));

      if (designation || name) {
        contacts.push({ name, designation, email, address, phones });
      }
    }
  }
  return contacts;
}

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UPCivicDirectorySync/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getUpDistrictUrls(): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  const res = await fetchWithTimeout("https://uttarpradesh.s3waas.gov.in/", 15000);
  if (!res || !res.ok) {
    console.error("Failed to fetch uttarpradesh.s3waas.gov.in");
    return urlMap;
  }
  const html = await res.text();
  const matches = html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  for (const m of matches) {
    const url = m[1].replace(/\/+$/, "");
    const text = decodeHtml(m[2]).toLowerCase().replace(/[^a-z]/g, "");
    if (!text) continue;
    if (/uttarpradesh\.s3waas|up\.gov\.in|s3waas\.gov\.in$|digitalindia|india\.gov/i.test(url)) continue;
    if (/\.(nic|gov)\.in$/i.test(url)) {
      if (!urlMap.has(text)) urlMap.set(text, url);
    }
  }
  return urlMap;
}

function isCleanOfficerName(name: string): boolean {
  if (!name || name.length < 3) return false;
  if (/^(vacant|na|n\/a|-+|nil|none|tbd|blank)$/i.test(name.trim())) return false;
  if (/^\d+$/.test(name.trim())) return false;
  return true;
}

function matchContactForOffice(office: any, contacts: ParsedContact[]): ParsedContact | null {
  const role = office.role;
  const officeName = (office.office_name_en || "").toLowerCase();

  if (role === "dm") {
    return (
      contacts.find((c) =>
        /\b(district magistrate|collector\s*&\s*dm|dm\s*&\s*collector)\b/i.test(c.designation) &&
        !/additional|adm\b|sub[\s-]*divisional|sdm\b|city magistrate/i.test(c.designation)
      ) || null
    );
  }
  if (role === "cdo") {
    return (
      contacts.find((c) => /\b(chief development officer|cdo)\b/i.test(c.designation)) || null
    );
  }
  if (role === "dpro") {
    return (
      contacts.find((c) => /\b(district panchayat raj officer|dpro|panchayat raj officer)\b/i.test(c.designation)) ||
      null
    );
  }
  if (role === "sdm") {
    // Extract tehsil name from office_name_en or covers[0]
    const tehsil = (office.covers?.[0] || "").replace(/-/g, " ").toLowerCase();
    const tehsilClean = tehsil.replace(/\btehsil\b/g, "").trim();
    if (!tehsilClean) return null;
    return (
      contacts.find(
        (c) =>
          /\b(sub[\s-]*divisional magistrate|sdm|sub divisional officer)\b/i.test(c.designation) &&
          (c.designation.toLowerCase().includes(tehsilClean) ||
            c.address.toLowerCase().includes(tehsilClean) ||
            c.email.toLowerCase().includes(tehsilClean.replace(/\s+/g, "")))
      ) || null
    );
  }
  return null;
}

async function fetchDistrictContacts(baseUrl: string): Promise<{ url: string; contacts: ParsedContact[] } | null> {
  const candidatePaths = ["/whos-who/", "/directory/", "/telephone-directory/", "/contact-us/", "/std-code-and-phone-numbers/"];
  for (const p of candidatePaths) {
    const target = `${baseUrl}${p}`;
    const res = await fetchWithTimeout(target, 10000);
    if (res && res.ok) {
      const html = await res.text();
      const contacts = parseS3waasTables(html);
      if (contacts.length > 0) {
        return { url: target, contacts };
      }
    }
  }
  // Fallback: check homepage for a whos-who or directory link
  const homeRes = await fetchWithTimeout(baseUrl + "/", 10000);
  if (homeRes && homeRes.ok) {
    const homeHtml = await homeRes.text();
    const linkMatch = homeHtml.match(/href=["'](https?:\/\/[^"']*(?:whos-who|directory|contact|telephone)[^"']*)["']/i);
    if (linkMatch) {
      const res = await fetchWithTimeout(linkMatch[1], 10000);
      if (res && res.ok) {
        const contacts = parseS3waasTables(await res.text());
        if (contacts.length > 0) return { url: linkMatch[1], contacts };
      }
    }
  }
  return null;
}

async function main() {
  console.log("Fetching UP S3WaaS district directory...");
  const s3waasUrls = await getUpDistrictUrls();
  console.log(`Found ${s3waasUrls.size} district links on uttarpradesh.s3waas.gov.in`);

  const districtsIndex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "districts.json"), "utf-8"));

  // Manual fallbacks for districts whose S3WaaS link text differs from id
  const manualUrlMap: Record<string, string> = {
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
    "rae-bareli": "https://raebareli.nic.in",
    "sant-kabir-nagar": "https://sknagar.nic.in",
    "shrawasti": "https://shravasti.nic.in",
    "siddharthnagar": "https://siddharthnagar.nic.in",
  };

  let districtsUpdated = 0;
  let officesUpdated = 0;
  let namesUpdated = 0;
  let phonesAdded = 0;
  let emailsUpdated = 0;
  const failedDistricts: string[] = [];

  // Process in batches of 8
  const batchSize = 8;
  for (let i = 0; i < districtsIndex.length; i += batchSize) {
    const batch = districtsIndex.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (d: any) => {
        const normId = d.id.replace(/[^a-z]/g, "");
        const normName = d.name_en.toLowerCase().replace(/[^a-z]/g, "");
        const baseUrl =
          manualUrlMap[d.id] ||
          s3waasUrls.get(normId) ||
          s3waasUrls.get(normName) ||
          `https://${normId}.nic.in`;

        const result = await fetchDistrictContacts(baseUrl);
        const filePath = path.join(DATA_DIR, "districts", `${d.id}.json`);
        if (!fs.existsSync(filePath)) return;

        const districtData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        if (!result) {
          failedDistricts.push(`${d.id} (${baseUrl})`);
          return;
        }

        let changed = false;
        const usedPhones = new Set<string>();
        // Pre-seed used phones from existing offices
        for (const off of districtData.offices) {
          for (const p of off.phones || []) {
            usedPhones.add(p.number.replace(/\s+/g, ""));
          }
        }

        for (const off of districtData.offices) {
          // Always fix source_url if it was broken hyphenated or generic
          if (off.source_url !== result.url && off.source_url?.includes(".nic.in")) {
            off.source_url = result.url;
            changed = true;
          }

          const match = matchContactForOffice(off, result.contacts);
          if (!match) continue;

          officesUpdated++;
          off.source_url = result.url;
          off.valid_as_of = TODAY;
          changed = true;

          if (isCleanOfficerName(match.name) && off.officer_name_en !== match.name) {
            off.officer_name_en = match.name;
            namesUpdated++;
          }

          if (match.email && off.email !== match.email) {
            off.email = match.email;
            emailsUpdated++;
          }

          if (match.address && !off.address_en) {
            off.address_en = match.address;
          }

          if (match.phones.length > 0) {
            const existingNums = new Set((off.phones || []).map((p: any) => p.number.replace(/\s+/g, "")));
            for (const num of match.phones) {
              if (!existingNums.has(num) && !usedPhones.has(num)) {
                off.phones = off.phones || [];
                off.phones.push({
                  number: num,
                  type: num.includes("-") ? "landline" : "office",
                  source_url: result.url,
                  checked_on: TODAY,
                  status: "verified",
                });
                usedPhones.add(num);
                existingNums.add(num);
                phonesAdded++;
              } else if (existingNums.has(num)) {
                // Refresh checked_on & source_url
                for (const p of off.phones) {
                  if (p.number.replace(/\s+/g, "") === num) {
                    p.source_url = result.url;
                    p.checked_on = TODAY;
                    p.status = "verified";
                  }
                }
              }
            }
          }
        }

        if (changed) {
          districtData.verified_on = TODAY;
          fs.writeFileSync(filePath, JSON.stringify(districtData, null, 2) + "\n", "utf-8");
          d.coverage.last_verified = TODAY;
          districtsUpdated++;
        }
      })
    );
    process.stdout.write(`Processed ${Math.min(i + batchSize, districtsIndex.length)}/${districtsIndex.length}\r`);
  }

  fs.writeFileSync(path.join(DATA_DIR, "districts.json"), JSON.stringify(districtsIndex, null, 2) + "\n", "utf-8");

  console.log("\n=== S3WaaS Sync Summary ===");
  console.log(`Districts synced & updated: ${districtsUpdated} / ${districtsIndex.length}`);
  console.log(`Offices matched: ${officesUpdated}`);
  console.log(`Officer names updated: ${namesUpdated}`);
  console.log(`Emails updated: ${emailsUpdated}`);
  console.log(`New verified phones added: ${phonesAdded}`);
  console.log(`Districts without S3WaaS table match (${failedDistricts.length}):`, failedDistricts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
