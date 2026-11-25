import { phoneRegex } from "../../lib/validate";

export interface PdfParsedRow {
  url: string;
  name: string;
  designation: string;
  email: string;
  address: string;
  phones: string[];
  rawText: string;
}

const KD_MAP: Record<string, string> = {
  "Q+Z": "फ़्र",
  "¶+": "फ़",
  "d+": "क़",
  "[k+": "ख़",
  "x+": "ग़",
  "T+": "ज़",
  "t+": "ज़",
  "M+": "ड़",
  "<+": "ढ़",
  "Q+": "फ़",
  ";+": "य़",
  "j+": "ऱ",
  "u+": "ऩ",
  "Ùk": "त्त",
  "Ù": "त्त्",
  "ä": "क्त",
  "f=k": "त्रि",
  "=kk": "त्रा",
  "{k": "क्ष",
  "{": "क्ष्",
  "=": "त्र",
  "«": "त्र्",
  K: "ज्ञ",
  "}": "ज्ञ्",
  "Vª": "ट्र",
  "Mª": "ड्र",
  "<ª": "ढ्र",
  "Nª": "छ्र",
  "Ø": "क्र",
  "Ý": "फ्र",
  "æ": "द्र",
  "ç": "प्र",
  "Á": "प्र",
  "xz": "ग्र",
  "ºz": "ह्र",
  vks: "ओ",
  vkS: "औ",
  vk: "आ",
  v: "अ",
  bZ: "ई",
  b: "इ",
  m: "उ",
  "Å": "ऊ",
  ",s": "ऐ",
  ",": "ए",
  _: "ऋ",
  Dk: "क",
  d: "क",
  D: "क्",
  "[k": "ख",
  "[": "ख्",
  Xk: "ग",
  x: "ग",
  X: "ग्",
  "?k": "घ",
  "?": "घ्",
  Ä: "ङ",
  Pk: "च",
  p: "च",
  P: "च्",
  N: "छ",
  Tk: "ज",
  t: "ज",
  T: "ज्",
  ">": "झ",
  "¥": "ञ्",
  V: "ट",
  B: "ठ",
  M: "ड",
  "<": "ढ",
  ".k": "ण",
  ".": "ण्",
  Rk: "त",
  r: "त",
  R: "त्",
  Fk: "थ",
  F: "थ्",
  n: "द",
  "/k": "ध",
  "/": "ध",
  Ë: "ध",
  èk: "ध",
  è: "ध्",
  Uk: "न",
  u: "न",
  U: "न्",
  Ik: "प",
  i: "प",
  I: "प्",
  Q: "फ",
  "¶": "फ्",
  Ck: "ब",
  c: "ब",
  C: "ब्",
  Hk: "भ",
  H: "भ्",
  Ek: "म",
  e: "म",
  E: "म्",
  ";": "य",
  "¸": "य्",
  j: "र",
  Yk: "ल",
  y: "ल",
  Y: "ल्",
  G: "ळ",
  Ok: "व",
  o: "व",
  O: "व्",
  "'k": "श",
  "'": "श्",
  '"k': "ष",
  '"': "ष्",
  "”k": "श",
  "”": "श्",
  Lk: "स",
  l: "स",
  L: "स्",
  g: "ह",
  J: "श्र",
  z: "्र",
  k: "ा",
  h: "ी",
  q: "ु",
  w: "ू",
  "`": "ृ",
  s: "े",
  S: "ै",
  ks: "ो",
  kS: "ौ",
  a: "ं",
  "¡": "ँ",
  W: "ॉ",
  "~": "्",
  "]": ",",
  "&": "-",
  A: "।",
  "¼": "(",
  "½": ")",
};

const KD_KEYS = Object.keys(KD_MAP).sort((a, b) => b.length - a.length);
const KD_RE = new RegExp(
  KD_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "g"
);

export function isKrutiDevText(text: string): boolean {
  return /vf\/kdkjh|ftykf\/kdkjh|\[k\.M|ikfydk|uxj|fodkl/i.test(text);
}

export function krutiDevToUnicode(str: string): string {
  // Stash emails and standalone English acronyms so Kruti Dev substitution never corrupts "EO", "BDO", "SDM", etc.
  const preserved: string[] = [];
  let work = (str || "").replace(
    /[a-z0-9._%+-]+(?:\[at\]|@)[a-z0-9.\[\]-]+|\b(?:EO|BDO|SDM|CDO|DPRO|IAS|PCS|DM|ADM|SDO|CUG|RES|VDA|DDO|PD|DRDA|STD|PIN|FAX|CMO|BEO|ADO|CEO)\b/g,
    (m) => {
      preserved.push(m);
      return ` \uE000${preserved.length - 1}\uE001 `;
    }
  );

  work = work.replace(KD_RE, (m) => KD_MAP[m] ?? m);
  // Move short-i matra 'f' after its consonant / conjunct cluster
  work = work.replace(
    /f([\u0915-\u0939\u0958-\u095f](?:\u094d[\u0915-\u0939\u0958-\u095f])*)/g,
    "$1ि"
  );
  // Move Kruti Dev reph 'Z' before the base syllable
  work = work.replace(
    /([\u0915-\u0939\u0958-\u095f][\u093e-\u094c]*)Z/g,
    "र्$1"
  );
  work = work.replace(/Z/g, "र्");

  work = work.replace(/\uE000(\d+)\uE001/g, (_, idx) => preserved[Number(idx)] ?? "");
  return work.replace(/\s+/g, " ").trim();
}

export function extractPdfPhones(raw: string, stdHint?: string): string[] {
  const results = new Set<string>();
  // Split letter-to-digit joins (e.g. "Kalpi9956817178") and 16+ digit landline+CUG concatenations
  const separated = (raw || "")
    .replace(/&#8211;|&ndash;|&mdash;/g, "-")
    .replace(/([a-zA-Z])(\d{6,})/g, "$1 $2")
    .replace(/(\b0\d{2,4}-\d{6,7})(94\d{8}|[6-9]\d{9})(?!\d)/g, "$1 $2")
    .replace(/(\d{6,})(94\d{8}|[6-9]\d{9})(?=\D|$)/g, (all, pre, mob) =>
      pre.length + mob.length >= 16 ? `${pre} ${mob}` : all
    );

  for (const m of separated.matchAll(/(?:\+?91[\s-]*)?\b0?([6-9]\d{9})\b/g)) {
    results.add(m[1]);
  }
  for (const m of separated.matchAll(/\b(0\d{2,4})[\s-]+(\d{6,8})\b/g)) {
    const formatted = `${m[1]}-${m[2]}`;
    if (phoneRegex.test(formatted)) results.add(formatted);
  }
  if (stdHint && /^0\d{2,4}$/.test(stdHint)) {
    for (const m of separated.matchAll(/\b(\d{6,8})\b/g)) {
      const formatted = `${stdHint}-${m[1]}`;
      if (phoneRegex.test(formatted)) results.add(formatted);
    }
  }
  return [...results];
}

const EXCLUDE_PDF_LINE_RE =
  /शिक्षा|education|बेसिक|abhiyanta|अभियन्ता|engineer|विद्युत|electricity|नलकूप|tubewell|बाढ़|flood|police|पुलिस|थाना|thana|क्षेत्राधिकारी|inspector|आबकारी|excise|सिंचाई|irrigation|वाणिज्य|tax|समाज कल्याण|कृषि|agriculture|वन|forest|न्यायाधीश|judge|कारागार|jail|fishery|fisheries|मत्स्य|chief executive|जिला विकास अधिकारी|lekhpal|लेखपाल|bima|बीमा|yojana|योजना/i;

const DESIGNATION_PDF_LINE_RE =
  /\b(?:dm|district magistrate|cdo|chief development officer|dpro|district panchayat raj|sdm|sub[\s-]*divisional magistrate|bdo|block development officer|eo|executive officer|municipal commissioner|nagar ayukt)\b|जिलाधिकारी|मुख्य विकास अधिकारी|जिला पंचायत\s*राज|उप\s*जिलाधिकारी|उपजिलाधिकारी|खण्ड विकास अधिकारी|खंड विकास अधिकारी|अधिशासी अधिकारी|नगर आयुक्त/i;

export function parsePdfDirectoryText(
  rawText: string,
  url: string,
  normalizeEmailFn: (s: string) => string
): PdfParsedRow[] {
  const rows: PdfParsedRow[] = [];
  const kd = isKrutiDevText(rawText);
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^(?:Warning:|S\.?No\.?\s+Name|DescriptionOffice)/i.test(l));

  const lines = rawLines.map((l) => {
    const u = kd ? krutiDevToUnicode(l) : l;
    return u
      .replace(
        /([a-z0-9.)])(Executive\s+Officer|District\s+Magistrate|Chief\s+Development\s+Officer|Sub[\s-]*Divisional\s+Magistrate|Block\s+Development\s+Officer|District\s+Panchayat\s+Raj|Municipal\s+Commissioner|Nagar\s+Ayukt|BDO\b|SDM\b|CDO\b|DPRO\b)/g,
        "$1 $2"
      )
      .replace(
        /([\u0900-\u097F])(?:प्र0\s*)?(जिलाधिकारी|मुख्य विकास अधिकारी|जिला पंचायत\s*राज|उप\s*जिलाधिकारी|उपजिलाधिकारी|खण्ड विकास अधिकारी|खंड विकास अधिकारी|अधिशासी अधिकारी|नगर आयुक्त)/g,
        "$1 $2"
      );
  });
  const fullJoined = lines.slice(0, 20).join(" ");
  const stdMatch = fullJoined.match(/STD\s*(?:Code)?\s*[:\-–]?\s*(0\d{2,4})/i);
  const pageStd = stdMatch ? stdMatch[1] : undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 150 || EXCLUDE_PDF_LINE_RE.test(line)) continue;
    if (!DESIGNATION_PDF_LINE_RE.test(line)) continue;

    let combined = line;
    let phones = extractPdfPhones(combined, pageStd);
    let email = normalizeEmailFn(combined);

    // Only look ahead 1-2 immediate lines when phone is absent, stopping before any next designation/officer header
    if (phones.length === 0) {
      for (let k = 1; k <= 2 && i + k < lines.length; k++) {
        const nextLine = lines[i + k];
        if (
          nextLine.length > 120 ||
          DESIGNATION_PDF_LINE_RE.test(nextLine) ||
          EXCLUDE_PDF_LINE_RE.test(nextLine)
        ) {
          break;
        }
        const nextPhones = extractPdfPhones(nextLine, pageStd);
        const nextEmail = normalizeEmailFn(nextLine);
        if (nextPhones.length > 0 || nextEmail) {
          combined = `${combined} ${nextLine}`;
          if (nextPhones.length > 0) phones = [...new Set([...phones, ...nextPhones])];
          if (!email && nextEmail) email = nextEmail;
          if (phones.length > 0) break;
        }
      }
    } else if (!email && i + 1 < lines.length) {
      const nextEmail = normalizeEmailFn(lines[i + 1]);
      if (nextEmail && !DESIGNATION_PDF_LINE_RE.test(lines[i + 1])) {
        email = nextEmail;
        combined = `${combined} ${lines[i + 1]}`;
      }
    }

    if (phones.length > 0 || email) {
      let cleanLine = line
        .replace(/^\d+[\s.)&]+/, "")
        .replace(/[\d,-]{6,}.*$/, "")
        .trim();
      let extractedName = "";
      const eoSplit = cleanLine.match(
        /^(.{3,45}?)\s*(?:प्र0|प्रभारी)?\s+(Executive Officer(?:\/(?:SDM|CM|SDO))?|अधिशासी अधिकारी)(?=$|[\s,:\-–/])[,:\s\-–]*(.*)$/i
      );
      if (eoSplit && !/^\d+$/.test(eoSplit[1].trim())) {
        extractedName = eoSplit[1].replace(/^(?:प्र0|प्रभारी)\s+/i, "").trim();
        const townPart = eoSplit[3].replace(/^\s*[-,:/]+\s*/, "").trim();
        cleanLine = townPart ? `Executive Officer, ${townPart}` : cleanLine;
      }
      rows.push({
        url,
        name: extractedName,
        designation: cleanLine || line,
        email,
        address: "",
        phones,
        rawText: combined,
      });
    }
  }
  return rows;
}
