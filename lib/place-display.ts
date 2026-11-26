import { DistrictData, Office, Place } from "./types";
import { Lang } from "./i18n";

const UPPER_TOKENS = new Set(["noida", "gnida", "yeida", "bida", "upsidc", "bdo", "sdm", "cdo", "dm", "ulb"]);

export function humanizeSlug(slug: string | undefined | null): string {
  if (!slug) return "";
  const cleaned = slug
    .replace(/^(?:lgd-ulb-|lgd-|block-[a-z-]+-|po-|gp-|ulb-|cantt-|w-|bdo-|sdm-|eo-|teh-|blk-)/i, "")
    .replace(/-\d+$/, "")
    .replace(/-/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (UPPER_TOKENS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function cleanOfficeTitleForPlace(office: Office | undefined, lang: Lang): string {
  if (!office) return "";
  const raw = lang === "hi" ? office.office_name_hi || office.office_name_en : office.office_name_en;
  if (!raw) return "";
  if (lang === "hi") {
    const cleaned = raw
      .replace(/^विकास\s*खंड\s*कार्यालय[,:\s-]*/i, "")
      .replace(/^खंड\s*विकास\s*अधिकारी\s*(?:\(\s*बीडीओ\s*\))?[,:\s-]*/i, "")
      .replace(/^तहसील\s*कार्यालय[,:\s-]*/i, "")
      .replace(/^उपजिलाधिकारी\s*(?:\([^)]+\))?[,:\s-]*/i, "")
      .replace(/^एसडीएम\s*(?:\([^)]+\))?[,:\s-]*/i, "")
      .replace(/^कार्यालय[,:\s-]*/i, "")
      .trim();
    return cleaned || raw;
  }
  const cleaned = raw
    .replace(/^Block\s+Development\s+Office[,:\s-]*/i, "")
    .replace(/^Office\s+of\s+the\s+/i, "")
    .replace(/^Office\s+of\s+/i, "")
    .replace(/^BDO\s*[-,:\s]+/i, "")
    .replace(/^Sub-?Divisional\s+Magistrate\s*(?:\([^)]+\))?[,:\s-]*/i, "")
    .replace(/^SDM\s*(?:\([^)]+\))?[,:\s-]*/i, "")
    .replace(/^Tehsil(?:dar)?\s*(?:Office)?[,:\s-]*/i, "")
    .trim();
  const parenMatch = raw.match(/\(([^)]+)\)/);
  if (parenMatch && cleaned === raw && !/tehsil|block|municipality/i.test(parenMatch[1])) {
    return parenMatch[1].trim();
  }
  return cleaned || raw;
}

export function getPlaceBlockLabel(
  place: Place | null | undefined,
  districtData: DistrictData | null | undefined,
  lang: Lang
): string {
  if (!place) return "";
  const direct = lang === "hi" ? place.block_name_hi || place.block_name_en : place.block_name_en;
  if (direct) return direct;
  if (place.block_id) {
    const bdo = districtData?.offices?.find(
      (o) => o.role === "bdo" && o.covers.includes(place.block_id!)
    );
    const fromOffice = cleanOfficeTitleForPlace(bdo, lang);
    if (fromOffice) return fromOffice;
    return humanizeSlug(place.block_id);
  }
  return "";
}

export function getPlaceTehsilLabel(
  place: Place | null | undefined,
  districtData: DistrictData | null | undefined,
  lang: Lang
): string {
  if (!place) return "";
  const direct = lang === "hi" ? place.tehsil_name_hi || place.tehsil_name_en : place.tehsil_name_en;
  if (direct) return direct;
  if (place.tehsil_id) {
    const tehsilOffice = districtData?.offices?.find(
      (o) => (o.role === "tehsildar" || o.role === "sdm") && o.covers.includes(place.tehsil_id!)
    );
    const fromOffice = cleanOfficeTitleForPlace(tehsilOffice, lang);
    if (fromOffice) return fromOffice;
    return humanizeSlug(place.tehsil_id);
  }
  return "";
}

export function formatPlaceBlockAndTehsil(
  place: Place | null | undefined,
  districtData: DistrictData | null | undefined,
  lang: Lang
): string {
  if (!place) return "";
  const block = getPlaceBlockLabel(place, districtData, lang);
  const tehsil = getPlaceTehsilLabel(place, districtData, lang);
  if (block && tehsil) {
    if (block.toLowerCase() === tehsil.toLowerCase()) {
      return lang === "hi"
        ? `${block} (विकास खंड व तहसील)`
        : `${block} (Block & Tehsil)`;
    }
    return lang === "hi"
      ? `${block} (विकास खंड), ${tehsil} (तहसील)`
      : `${block} (Block), ${tehsil} (Tehsil)`;
  }
  if (block) {
    return lang === "hi" ? `${block} (विकास खंड)` : `${block} (Block)`;
  }
  if (tehsil) {
    return lang === "hi" ? `${tehsil} (तहसील)` : `${tehsil} (Tehsil)`;
  }
  return "";
}

export function formatPlaceLocalBody(
  place: Place | null | undefined,
  districtData: DistrictData | null | undefined,
  lang: Lang
): string {
  if (!place) return "";
  const placeName = lang === "hi" ? place.name_hi || place.name_en : place.name_en;
  if (place.local_body_type === "gram_panchayat") {
    const cleanName = placeName
      .replace(/\s*\(Full Block[^)]*\)/i, "")
      .replace(/\s*\(पूरा विकास खंड[^)]*\)/i, "")
      .trim();
    if (place.id.startsWith("block-")) {
      return lang === "hi" ? `${cleanName} विकास खंड` : `${cleanName} Development Block`;
    }
    if (place.gp_id && !place.gp_id.startsWith("gp-")) {
      return `${cleanName} (${humanizeSlug(place.gp_id)})`;
    }
    return lang === "hi" ? `ग्राम पंचायत ${cleanName}` : `Gram Panchayat ${cleanName}`;
  }

  if (place.ulb_id) {
    const ulbOffice = districtData?.offices?.find((o) =>
      o.covers.includes(place.ulb_id!) &&
      (o.role === "eo" || o.role === "commissioner" || o.role === "mayor" || o.role === "chairman" || o.role === "other")
    );
    if (ulbOffice) {
      const rawTitle = lang === "hi"
        ? ulbOffice.office_name_hi || ulbOffice.office_name_en
        : ulbOffice.office_name_en;
      const cleanedTitle =
        lang === "hi"
          ? rawTitle
              .replace(/^(?:अधिशासी\s*अधिकारी|नगर\s*आयुक्त|प्रशासनिक\s*अधिकारी|ई\.?ओ\.?)\s*[,:\-–/&]*\s*/u, "")
              .trim()
          : rawTitle
              .replace(/^(?:Executive\s+Officer|Municipal\s+Commissioner|Administrative\s+Officer|EO)\s*[,:\-–/&]*\s*/i, "")
              .trim();
      return cleanedTitle || rawTitle;
    }
  }

  if (place.local_body_type === "nagar_nigam") {
    return lang === "hi" ? `नगर निगम ${placeName}` : `Nagar Nigam ${placeName}`;
  }
  if (place.local_body_type === "nagar_palika_parishad") {
    return lang === "hi" ? `नगर पालिका परिषद ${placeName}` : `Nagar Palika Parishad ${placeName}`;
  }
  if (place.local_body_type === "nagar_panchayat") {
    return lang === "hi" ? `नगर पंचायत ${placeName}` : `Nagar Panchayat ${placeName}`;
  }
  if (place.local_body_type === "cantonment_board") {
    return lang === "hi" ? `छावनी परिषद ${placeName}` : `Cantonment Board ${placeName}`;
  }
  if (place.local_body_type === "authority_area") {
    return placeName;
  }
  return placeName;
}

export function formatPlaceSublabel(place: Place, lang: Lang): string {
  const parts: string[] = [];
  if (place.local_body_type === "gram_panchayat") {
    const block = getPlaceBlockLabel(place, null, lang);
    const tehsil = getPlaceTehsilLabel(place, null, lang);
    if (block) {
      parts.push(lang === "hi" ? `विकास खंड: ${block}` : `Block: ${block}`);
    }
    if (tehsil && tehsil.toLowerCase() !== block.toLowerCase()) {
      parts.push(lang === "hi" ? `तहसील: ${tehsil}` : `Tehsil: ${tehsil}`);
    }
  } else if (place.local_body_type === "nagar_nigam") {
    parts.push(lang === "hi" ? "नगर निगम" : "Nagar Nigam");
  } else if (place.local_body_type === "nagar_palika_parishad") {
    parts.push(lang === "hi" ? "नगर पालिका परिषद" : "Nagar Palika Parishad");
  } else if (place.local_body_type === "nagar_panchayat") {
    parts.push(lang === "hi" ? "नगर पंचायत" : "Nagar Panchayat");
  } else if (place.local_body_type === "cantonment_board") {
    parts.push(lang === "hi" ? "छावनी परिषद" : "Cantonment Board");
  } else if (place.local_body_type === "authority_area") {
    parts.push(lang === "hi" ? "विकास प्राधिकरण" : "Development Authority");
  }
  if (place.pincodes && place.pincodes.length > 0) {
    parts.push(`PIN ${place.pincodes.slice(0, 2).join("/")}`);
  }
  return parts.join(" · ");
}
