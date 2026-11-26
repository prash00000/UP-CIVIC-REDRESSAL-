import { DistrictData, DistrictIndexEntry, Issue, Place } from "./types";
import { ResolvedOfficerItem } from "./resolver";
import { Lang, getLocalized } from "./i18n";
import { formatPlaceBlockAndTehsil, formatPlaceLocalBody, humanizeSlug } from "./place-display";

export function build1076ComplaintSummary(params: {
  lang: Lang;
  district?: DistrictIndexEntry | null;
  districtData?: DistrictData | null;
  place?: Place | null;
  issue?: Issue | null;
  primaryOfficer?: ResolvedOfficerItem | null;
  pincode?: string;
}): string {
  const { lang, district, districtData, place, issue, primaryOfficer, pincode } = params;
  const distName = district
    ? lang === "hi"
      ? district.name_hi
      : district.name_en
    : districtData
    ? humanizeSlug(districtData.district_id)
    : "";
  const placeName = place
    ? lang === "hi"
      ? place.name_hi || place.name_en
      : place.name_en
    : "";
  const blockTehsil = formatPlaceBlockAndTehsil(place, districtData, lang);
  const localBody = formatPlaceLocalBody(place, districtData, lang);
  const issueTitle = issue
    ? lang === "hi"
      ? issue.title_hi
      : issue.title_en
    : lang === "hi"
    ? "सार्वजनिक नागरिक समस्या (कृपया विषय बताएं)"
    : "Civic grievance (state exact issue)";
  const officerName = primaryOfficer
    ? getLocalized(primaryOfficer.office, "office_name", lang)
    : "";
  const officerPhone = primaryOfficer?.office.phones?.[0]?.number || "";
  const pinStr =
    pincode && /^\d{6}$/.test(pincode)
      ? pincode
      : place?.pincodes?.[0] || "";

  if (lang === "hi") {
    const areaParts = [placeName || localBody, blockTehsil, distName ? `जिला ${distName}` : ""]
      .filter(Boolean)
      .join(", ");
    return [
      `सीएम हेल्पलाइन 1076 / जनसुनवाई शिकायत सारांश:`,
      `• क्षेत्र: ${areaParts}${pinStr ? ` (पिन: ${pinStr})` : ""}`,
      localBody ? `• निकाय: ${localBody}` : null,
      `• समस्या: ${issueTitle}`,
      `• निवेदन: कृपया उपरोक्त स्थान पर शीघ्र स्थलीय जांच कर समस्या का समाधान कराएं।`,
      officerName
        ? `• प्रथम संबंधित अधिकारी: ${officerName}${officerPhone ? ` (${officerPhone})` : ""}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const areaParts = [placeName || localBody, blockTehsil, distName ? `District ${distName}` : ""]
    .filter(Boolean)
    .join(", ");
  return [
    `CM Helpline 1076 / Jansunwai Complaint Summary:`,
    `• Location: ${areaParts}${pinStr ? ` (PIN: ${pinStr})` : ""}`,
    localBody ? `• Local Body: ${localBody}` : null,
    `• Issue: ${issueTitle}`,
    `• Request: Kindly arrange an urgent on-site inspection and resolve this civic issue at the exact location.`,
    officerName
      ? `• First Responsible Officer: ${officerName}${officerPhone ? ` (${officerPhone})` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
