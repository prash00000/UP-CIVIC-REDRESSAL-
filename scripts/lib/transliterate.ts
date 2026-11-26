const DEV_DIGITS = "०१२३४५६७८९";

export function normalizeDevanagariDigits(text: string): string {
  return (text || "").replace(/[\u0966-\u096f]/g, (ch) => {
    const idx = DEV_DIGITS.indexOf(ch);
    return idx >= 0 ? String(idx) : ch;
  });
}

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

export function devanagariToLatin(text: string): string {
  const clean = normalizeDevanagariDigits(text || "").replace(/\u093c/g, "");
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

const PHRASE_DICT: Array<[RegExp, string]> = [
  [/\bNew Okhla Industrial Development Authority\b/gi, "नई ओखला औद्योगिक विकास प्राधिकरण"],
  [/\bGreater Noida Industrial Development Authority\b/gi, "ग्रेटर नोएडा औद्योगिक विकास प्राधिकरण"],
  [/\bYamuna Expressway Industrial Development Authority\b/gi, "यमुना एक्सप्रेसवे औद्योगिक विकास प्राधिकरण"],
  [/\bIndustrial Development Authority\b/gi, "औद्योगिक विकास प्राधिकरण"],
  [/\bNagar Palika Parishad\b/gi, "नगर पालिका परिषद"],
  [/\bNagar Palika\b/gi, "नगर पालिका"],
  [/\bNagar Panchayat\b/gi, "नगर पंचायत"],
  [/\bNagar Nigam\b/gi, "नगर निगम"],
  [/\bMunicipality\s+Corporation\b/gi, "नगर निगम"],
  [/\bMunicipal\s+Corporation\b/gi, "नगर निगम"],
  [/\bMunicipal\s+Board\b/gi, "नगर पालिका परिषद"],
  [/\bMunicipality\b/gi, "नगर पालिका"],
  [/\bTown\s+Area\b/gi, "नगर पंचायत"],
  [/\bCantonment Board\b/gi, "छावनी परिषद"],
  [/\bVikas Khand\b/gi, "विकास खंड"],
  [/\bDevelopment Block\b/gi, "विकास खंड"],
  [/\bGram Panchayat\b/gi, "ग्राम पंचायत"],
  [/\bBakshi Ka Talab\b/gi, "बक्शी का तालाब"],
  [/\bBakhshi Ka Talab\b/gi, "बक्शी का तालाब"],
  [/\bSarojini Nagar\b/gi, "सरोजिनी नगर"],
  [/\bSarojani Nagar\b/gi, "सरोजिनी नगर"],
  [/\bGautam Buddha Nagar\b/gi, "गौतम बुद्ध नगर"],
  [/\bSant Kabir Nagar\b/gi, "संत कबीर नगर"],
  [/\bAmbedkar Nagar\b/gi, "अंबेडकर नगर"],
  [/\bKanpur Nagar\b/gi, "कानपुर नगर"],
  [/\bKanpur Dehat\b/gi, "कानपुर देहात"],
  [/\bLakhimpur Kheri\b/gi, "लखीमपुर खीरी"],
  [/\bMaunath Bhanjan\b/gi, "मऊनाथ भंजन"],
  [/\bPandit Deendayal Upadhyay Nagar\b/gi, "पंडित दीनदयाल उपाध्याय नगर"],
  [/\bKashi Vidya\s*p(?:ee|i)th\b/gi, "काशी विद्यापीठ"],
  [/\bVidya\s*p(?:ee|i)th\b/gi, "विद्यापीठ"],
  [/\bNaugawan Sadat\b/gi, "नौगावां सादात"],
  [/\bRaja Talab\b/gi, "राजा तालाब"],
  [/\bChauri Chaura\b/gi, "चौरी चौरा"],
  [/\bGreater Noida\b/gi, "ग्रेटर नोएडा"],
  [/\bYamuna Expressway\b/gi, "यमुना एक्सप्रेसवे"],
];

const WORD_DICT: Record<string, string> = {
  kashi: "काशी",
  vidya: "विद्या",
  pith: "पीठ",
  peeth: "पीठ",
  sadar: "सदर",
  rural: "ग्रामीण",
  urban: "शहरी",
  city: "शहर",
  central: "मध्य",
  north: "उत्तर",
  south: "दक्षिण",
  east: "पूर्व",
  west: "पश्चिम",
  purbi: "पूर्वी",
  purvi: "पूर्वी",
  paschim: "पश्चिम",
  paschimi: "पश्चिमी",
  uttar: "उत्तर",
  dakshin: "दक्षिण",
  main: "मुख्य",
  tehsil: "तहसील",
  tahsil: "तहसील",
  block: "विकास खंड",
  district: "जिला",
  gram: "ग्राम",
  panchayat: "पंचायत",
  nagar: "नगर",
  palika: "पालिका",
  parishad: "परिषद",
  nigam: "निगम",
  municipal: "नगर पालिका",
  municipality: "नगर पालिका",
  corporation: "निगम",
  board: "परिषद",
  authority: "प्राधिकरण",
  industrial: "औद्योगिक",
  development: "विकास",
  bnp: "बी.एन.पी.",
  ba: "बी.ए.",
  ward: "वार्ड",
  town: "कस्बा",
  cantt: "छावनी",
  cantonment: "छावनी",
  khas: "खास",
  kalan: "कलाँ",
  kala: "कलाँ",
  khurd: "खुर्द",
  bujurg: "बुजुर्ग",
  buzurg: "बुजुर्ग",
  urf: "उर्फ",
  bazar: "बाजार",
  bazaar: "बाजार",
  ganj: "गंज",
  pur: "पुर",
  pura: "पुरा",
  garh: "गढ़",
  garhi: "गढ़ी",
  gaon: "गाँव",
  ghat: "घाट",
  khera: "खेड़ा",
  kheda: "खेड़ा",
  patti: "पट्टी",
  chak: "चक",
  sarai: "सराय",
  saray: "सराय",
  dih: "डीह",
  deeh: "डीह",
  tola: "टोला",
  majra: "मजरा",
  bagh: "बाग",
  kot: "कोट",
  kotwali: "कोतवाली",
  bhawan: "भवन",
  bhavan: "भवन",
  mandir: "मंदिर",
  talab: "तालाब",
  noida: "नोएडा",
  gnida: "ग्रेटर नोएडा प्राधिकरण",
  yeida: "यमुना एक्सप्रेसवे प्राधिकरण",
  new: "न्यू",
  old: "पुराना",
  ka: "का",
  ki: "की",
  ke: "के",
  se: "से",
  of: "ऑफ",
  and: "एंड",
  np: "नगर पंचायत",
  npp: "नगर पालिका परिषद",
  ulb: "नगरीय निकाय",
  rampur: "रामपुर",
  sultanpur: "सुल्तानपुर",
  gopalpur: "गोपालपुर",
  shekhpur: "शेखपुर",
  shaikhpur: "शेखपुर",
  mohanlalganj: "मोहनलालगंज",
  malihabad: "मलिहाबाद",
  gosainganj: "गोसाईंगंज",
  gosaiganj: "गोसाईंगंज",
  kakori: "काकोरी",
  chinhat: "चिनहट",
  lucknow: "लखनऊ",
  jaunpur: "जौनपुर",
  varanasi: "वाराणसी",
  prayagraj: "प्रयागराज",
  agra: "आगरा",
  ayodhya: "अयोध्या",
  khurja: "खुर्जा",
  dadri: "दादरी",
  jewar: "जेवर",
  dankaur: "दनकौर",
  bisrakh: "बिसरख",
  mariahu: "मड़ियाहूँ",
  mariyahu: "मड़ियाहूँ",
  shahganj: "शाहगंज",
  machhlishahr: "मछलीशहर",
  badlapur: "बदलापुर",
  kerakat: "केराकत",
  karanjit: "करंजीत",
  karanja: "करंजा",
  khetapur: "खेतापुर",
  pandeypur: "पांडेयपुर",
  achhnera: "अछनेरा",
  aligarh: "अलीगढ़",
  bareilly: "बरेली",
  gorakhpur: "गोरखपुर",
  kanpur: "कानपुर",
  meerut: "मेरठ",
  jhansi: "झांसी",
  moradabad: "मुरादाबाद",
  mathura: "मथुरा",
  ghaziabad: "गाजियाबाद",
  saharanpur: "सहारनपुर",
  firozabad: "फिरोजाबाद",
  shahjahanpur: "शाहजहाँपुर",
  azamgarh: "आजमगढ़",
  mirzapur: "मिर्जापुर",
  ballia: "बलिया",
  basti: "बस्ती",
  deoria: "देवरिया",
  ghazipur: "गाजीपुर",
  gonda: "गोंडा",
  hardoi: "हरदोई",
  sitapur: "सीतापुर",
  unnao: "उन्नाव",
  raebareli: "रायबरेली",
  pratapgarh: "प्रतापगढ़",
  bhadohi: "भदोही",
  chandauli: "चंदौली",
  sonbhadra: "सोनभद्र",
  kushinagar: "कुशीनगर",
  maharajganj: "महाराजगंज",
  siddharthnagar: "सिद्धार्थनगर",
  shravasti: "श्रावस्ती",
  bahraich: "बहराइच",
  balrampur: "बलरामपुर",
  barabanki: "बाराबंकी",
  amethi: "अमेठी",
  kaushambi: "कौशांबी",
  fatehpur: "फतेहपुर",
  banda: "बांदा",
  chitrakoot: "चित्रकूट",
  hamirpur: "हमीरपुर",
  mahoba: "महोबा",
  jalaun: "जालौन",
  lalitpur: "ललितपुर",
  etawah: "इटावा",
  auraiya: "औरैया",
  farrukhabad: "फर्रुखाबाद",
  kannauj: "कन्नौज",
  mainpuri: "मैनपुरी",
  etah: "एटा",
  kasganj: "कासगंज",
  hathras: "हाथरस",
  budaun: "बदायूँ",
  pilibhit: "पीलीभीत",
  bijnor: "बिजनौर",
  amroha: "अमरोहा",
  sambhal: "संभल",
  bulandshahr: "बुलंदशहर",
  hapur: "हापुड़",
  baghpat: "बागपत",
  muzaffarnagar: "मुजफ्फरनगर",
  shamli: "शामली",
  mau: "मऊ",
  mauaima: "मऊआइमा",
  phulpur: "फूलपुर",
  phoolpur: "फूलपुर",
  lalganj: "लालगंज",
  nawabganj: "नवाबगंज",
  akbarpur: "अकबरपुर",
  mohammadabad: "मोहम्मदाबाद",
  muhammadabad: "मुहम्मदाबाद",
  sikandrabad: "सिकंदराबाद",
  sikandarpur: "सिकंदरपुर",
};

const LATIN_VOWEL_INIT: Array<[string, string]> = [
  ["aa", "आ"],
  ["ai", "ऐ"],
  ["au", "औ"],
  ["ou", "औ"],
  ["ee", "ई"],
  ["ii", "ई"],
  ["oo", "ऊ"],
  ["uu", "ऊ"],
  ["ri", "ऋ"],
  ["a", "अ"],
  ["i", "इ"],
  ["u", "उ"],
  ["e", "ए"],
  ["o", "ओ"],
];

const LATIN_MATRAS: Array<[string, string]> = [
  ["aa", "ा"],
  ["ai", "ै"],
  ["au", "ौ"],
  ["ou", "ौ"],
  ["ee", "ी"],
  ["ii", "ी"],
  ["oo", "ू"],
  ["uu", "ू"],
  ["ri", "ृ"],
  ["a", ""],
  ["i", "ि"],
  ["u", "ु"],
  ["e", "े"],
  ["o", "ो"],
];

const LATIN_CONS: Array<[string, string]> = [
  ["ksh", "क्ष"],
  ["chh", "छ"],
  ["shh", "ष"],
  ["kh", "ख"],
  ["gh", "घ"],
  ["ch", "च"],
  ["jh", "झ"],
  ["th", "थ"],
  ["dh", "ध"],
  ["ph", "फ"],
  ["bh", "भ"],
  ["sh", "श"],
  ["gy", "ज्ञ"],
  ["tr", "त्र"],
  ["k", "क"],
  ["g", "ग"],
  ["c", "च"],
  ["j", "ज"],
  ["t", "त"],
  ["d", "द"],
  ["n", "न"],
  ["p", "प"],
  ["f", "फ"],
  ["b", "ब"],
  ["m", "म"],
  ["y", "य"],
  ["r", "र"],
  ["l", "ल"],
  ["v", "व"],
  ["w", "व"],
  ["s", "स"],
  ["h", "ह"],
  ["q", "क"],
  ["z", "ज"],
  ["x", "क्स"],
];

function startsWithOne(s: string, pos: number, table: Array<[string, string]>): [string, string] | null {
  for (const entry of table) {
    if (s.startsWith(entry[0], pos)) return entry;
  }
  return null;
}

const SUFFIX_REWRITES: Array<[RegExp, string]> = [
  [/pur$/i, "पुर"],
  [/pura$/i, "पुरा"],
  [/puri$/i, "पुरी"],
  [/ganj$/i, "गंज"],
  [/nagar$/i, "नगर"],
  [/garh$/i, "गढ़"],
  [/garhi$/i, "गढ़ी"],
  [/abad$/i, "आबाद"],
  [/khera$/i, "खेड़ा"],
  [/kheda$/i, "खेड़ा"],
  [/gaon$/i, "गाँव"],
  [/ghat$/i, "घाट"],
  [/patti$/i, "पट्टी"],
  [/sarai$/i, "सराय"],
  [/bazar$/i, "बाजार"],
  [/chowk$/i, "चौक"],
  [/bagh$/i, "बाग"],
  [/tola$/i, "टोला"],
];

function transliterateWordLatinToDevanagari(rawWord: string): string {
  if (!rawWord) return "";
  if (/[\u0900-\u097f]/.test(rawWord) || /^\d+$/.test(rawWord)) return rawWord;
  const low = rawWord.toLowerCase();
  if (WORD_DICT[low]) return WORD_DICT[low];
  if (low.length === 1 && /^[a-z]$/.test(low)) {
    const SINGLE_LETTER: Record<string, string> = {
      a: "ए", b: "बी", c: "सी", d: "डी", e: "ई", f: "एफ", g: "जी", h: "एच", i: "आई",
      j: "जे", k: "के", l: "एल", m: "एम", n: "एन", o: "ओ", p: "पी", q: "क्यू", r: "आर",
      s: "एस", t: "टी", u: "यू", v: "वी", w: "डब्ल्यू", x: "एक्स", y: "वाई", z: "जेड",
    };
    return SINGLE_LETTER[low] || low;
  }
  if (low.length <= 2 && /^[a-z]+$/.test(low)) {
    // Handle very short tokens/initials cleanly
    if (low === "e") return "ई";
    if (low === "o") return "ओ";
  }

  // Handle common UP compound suffixes cleanly before syllable parsing
  for (const [re, devSuffix] of SUFFIX_REWRITES) {
    if (re.test(low) && low.length > 4) {
      const stem = low.replace(re, "");
      if (stem.length >= 2) {
        return transliterateStem(stem) + devSuffix;
      }
    }
  }
  return transliterateStem(low);
}

function transliterateStem(word: string): string {
  const s = word.replace(/[^a-z]/g, "");
  if (!s) return word;
  if (WORD_DICT[s]) return WORD_DICT[s];

  let out = "";
  let i = 0;
  let isStart = true;

  while (i < s.length) {
    // Initial vowel
    if (isStart) {
      const v = startsWithOne(s, i, LATIN_VOWEL_INIT);
      if (v) {
        out += v[1];
        i += v[0].length;
        isStart = false;
        continue;
      }
    }
    isStart = false;

    const c = startsWithOne(s, i, LATIN_CONS);
    if (c) {
      // Handle nasal 'n' or 'm' before a non-nasal consonant (e.g., rampur, ganj, pandey, banki) -> anusvara
      if (
        (c[0] === "n" || c[0] === "m") &&
        i > 0 &&
        i + 1 < s.length &&
        !/[aeiouy]/.test(s[i + 1]) &&
        s[i + 1] !== c[0] &&
        !/^(n|m|y|r|l|v|w|h)$/.test(s[i + 1])
      ) {
        out += "ं";
        i += 1;
        continue;
      }

      // Collapse identical double consonant (e.g. 'tt', 'll', 'dd') except 'chh' handled earlier
      let step = c[0].length;
      if (step === 1 && i + 1 < s.length && s[i + 1] === c[0]) {
        step = 2;
      }

      out += c[1];
      i += step;

      // Check following vowel
      const matra = startsWithOne(s, i, LATIN_MATRAS);
      if (matra) {
        // Word-final 'a' or 'i' after a stem usually takes long vowel matra in Hindi place names (Sitapur/Gonda/Chakeri/Basti)
        if (matra[0] === "a" && i === s.length - 1 && s.length >= 3) {
          out += "ा";
        } else if (matra[0] === "i" && i === s.length - 1 && s.length >= 3) {
          out += "ी";
        } else {
          out += matra[1];
        }
        i += matra[0].length;
      } else if (i < s.length) {
        // Consonant cluster (halant) when next char is also a consonant, unless 'n'/'m' becomes anusvara
        const nextC = startsWithOne(s, i, LATIN_CONS);
        if (nextC && c[0] !== "n" && c[0] !== "m" && c[0] !== "r") {
          // Use explicit halant only for tight clusters like 'kt', 'st', 'pr', 'kr', 'tr', 'sk', 'nd' -> keep readable Hindi without excess halants
          if (/^(?:s|k|p|t|d|b|g)$/.test(c[0]) && /^(?:t|r|l|y|v|k)$/.test(nextC[0])) {
            out += "्";
          }
        }
      }
      continue;
    }

    // Medial/final vowel without preceding consonant (e.g. hiatal vowels like 'ia' in Mariahu, 'oa')
    const v = startsWithOne(s, i, LATIN_VOWEL_INIT);
    if (v) {
      out += v[1];
      i += v[0].length;
      continue;
    }

    out += s[i];
    i++;
  }

  return out;
}

/**
 * Convert Latin-script place/office text (or mixed Latin+Devanagari text) into clean Devanagari.
 * Preserves existing Devanagari words, digits, and punctuation.
 */
export function latinToDevanagari(text: string): string {
  if (!text) return "";
  let work = normalizeDevanagariDigits(text);

  // Apply multi-word administrative/district phrases first
  for (const [re, dev] of PHRASE_DICT) {
    work = work.replace(re, dev);
  }

  // Transliterate remaining ASCII word runs while keeping punctuation & Devanagari untouched
  return work
    .replace(/[A-Za-z]+/g, (word) => transliterateWordLatinToDevanagari(word))
    .replace(/\s+/g, " ")
    .trim();
}
