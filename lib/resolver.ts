import {
  Office,
  OfficeRole,
  Place,
  DistrictData,
  StateData,
  LocalBodyType,
} from "./types";

export type ResolvedOfficerItem = {
  office: Office;
  resolvedRole: OfficeRole;
  isVacant?: boolean;
  isFallback?: boolean;
  additionalChargeNote?: boolean;
  noPhone?: boolean;
};

export type ResolutionResult = {
  place: Place | null;
  officers: ResolvedOfficerItem[];
  hasCoverageGap: boolean;
  isCantonmentOrOther: boolean;
  stateHelpline: {
    number: string;
    url: string;
    name_en: string;
    name_hi: string;
  };
};

export function resolveOfficers(
  type: LocalBodyType | "unknown" | "other",
  districtId: string,
  placeId: string | null | undefined,
  districtData: DistrictData,
  placesList: Place[],
  stateData?: StateData
): ResolutionResult {
  const offices = districtData.offices || [];
  const place = placeId ? placesList.find((p) => p.id === placeId) || null : null;

  const stateInfo = {
    number: stateData?.cm_helpline?.number || "1076",
    url: stateData?.jansunwai?.url || "https://jansunwai.up.nic.in",
    name_en: stateData?.jansunwai?.name_en || "UP Jansunwai Portal",
    name_hi: stateData?.jansunwai?.name_hi || "उत्तर प्रदेश जनसुनवाई पोर्टल",
  };

  const isCantonmentOrOther =
    type === "other" ||
    type === "cantonment_board" ||
    type === "authority_area" ||
    place?.local_body_type === "cantonment_board" ||
    place?.local_body_type === "authority_area";

  // Helper to find office by role and coverage
  const findOffice = (
    role: OfficeRole,
    coverageId?: string
  ): Office | undefined => {
    return offices.find((o) => {
      if (o.role !== role) return false;
      if (!coverageId) return true;
      return (
        o.covers.includes(coverageId) ||
        o.covers.includes(districtId) ||
        o.covers.includes("all")
      );
    });
  };

  // Common high-level supervisory offices
  const dmOffice = findOffice("dm", districtId);
  const cdoOffice = findOffice("cdo", districtId);
  const sdmOffice =
    (place?.tehsil_id ? findOffice("sdm", place.tehsil_id) : undefined) ||
    findOffice("sdm", districtId);

  // 1. Cantonment or Authority / Other
  if (isCantonmentOrOther) {
    const list: ResolvedOfficerItem[] = [];
    // Check if a specific cantonment office is verified
    const canttOffice = offices.find(
      (o) =>
        (place?.ulb_id && o.covers.includes(place.ulb_id)) ||
        o.office_name_en.toLowerCase().includes("cantonment")
    );
    if (canttOffice) {
      list.push({
        office: canttOffice,
        resolvedRole: canttOffice.role,
        noPhone: canttOffice.phones.length === 0,
      });
    }

    if (sdmOffice) list.push({ office: sdmOffice, resolvedRole: "sdm", noPhone: sdmOffice.phones.length === 0 });
    if (cdoOffice) list.push({ office: cdoOffice, resolvedRole: "cdo", noPhone: cdoOffice.phones.length === 0 });
    if (dmOffice) list.push({ office: dmOffice, resolvedRole: "dm", noPhone: dmOffice.phones.length === 0 });

    return {
      place,
      officers: list,
      hasCoverageGap: false,
      isCantonmentOrOther: true,
      stateHelpline: stateInfo,
    };
  }

  // 2. Rural Gram Panchayat Flow
  if (type === "gram_panchayat" || place?.local_body_type === "gram_panchayat") {
    const gpId = place?.gp_id;
    const blockId = place?.block_id;

    const bdoOffice = blockId ? findOffice("bdo", blockId) : undefined;
    const adoOffice = blockId ? findOffice("ado_panchayat", blockId) : undefined;
    const dproOffice = findOffice("dpro", districtId);
    const tehsildarOffice = place?.tehsil_id
      ? findOffice("tehsildar", place.tehsil_id)
      : undefined;

    // Check Coverage Gap: Block or GP level data is missing
    const hasCoverageGap = !bdoOffice && !adoOffice;

    const list: ResolvedOfficerItem[] = [];

    // Secretary resolution
    let secretaryOffice = gpId ? findOffice("secretary", gpId) : undefined;

    if (!secretaryOffice || secretaryOffice.post_status === "vacant") {
      // Secretary is vacant or missing -> fallback to fallback_office_id (ADO Panchayat, else BDO)
      const fallbackId = secretaryOffice?.fallback_office_id;
      const fallbackOffice = fallbackId
        ? offices.find((o) => o.id === fallbackId)
        : adoOffice || bdoOffice;

      if (fallbackOffice) {
        list.push({
          office: fallbackOffice,
          resolvedRole: "secretary",
          isVacant: true,
          isFallback: true,
          noPhone: fallbackOffice.phones.length === 0,
        });
      }
    } else {
      list.push({
        office: secretaryOffice,
        resolvedRole: "secretary",
        additionalChargeNote: secretaryOffice.post_status === "additional_charge",
        noPhone: secretaryOffice.phones.length === 0,
      });
    }

    if (adoOffice) {
      list.push({
        office: adoOffice,
        resolvedRole: "ado_panchayat",
        noPhone: adoOffice.phones.length === 0,
      });
    }

    if (bdoOffice) {
      list.push({
        office: bdoOffice,
        resolvedRole: "bdo",
        noPhone: bdoOffice.phones.length === 0,
      });
    }

    if (dproOffice) {
      list.push({
        office: dproOffice,
        resolvedRole: "dpro",
        noPhone: dproOffice.phones.length === 0,
      });
    }

    if (tehsildarOffice) {
      list.push({
        office: tehsildarOffice,
        resolvedRole: "tehsildar",
        noPhone: tehsildarOffice.phones.length === 0,
      });
    } else if (sdmOffice) {
      list.push({
        office: sdmOffice,
        resolvedRole: "sdm",
        noPhone: sdmOffice.phones.length === 0,
      });
    }

    if (cdoOffice) {
      list.push({
        office: cdoOffice,
        resolvedRole: "cdo",
        noPhone: cdoOffice.phones.length === 0,
      });
    }

    if (dmOffice) {
      list.push({
        office: dmOffice,
        resolvedRole: "dm",
        noPhone: dmOffice.phones.length === 0,
      });
    }

    return {
      place,
      officers: list,
      hasCoverageGap,
      isCantonmentOrOther: false,
      stateHelpline: stateInfo,
    };
  }

  // 3. Nagar Panchayat / Nagar Palika Parishad Flow
  if (
    type === "nagar_panchayat" ||
    type === "nagar_palika_parishad" ||
    place?.local_body_type === "nagar_panchayat" ||
    place?.local_body_type === "nagar_palika_parishad"
  ) {
    const ulbId = place?.ulb_id;
    const eoOffice = ulbId ? findOffice("eo", ulbId) : findOffice("eo");
    const chairmanOffice = ulbId ? findOffice("chairman", ulbId) : findOffice("chairman");
    const wardOffice = ulbId ? findOffice("ward", ulbId) : undefined;

    const list: ResolvedOfficerItem[] = [];
    let pushedEoFallbackId: string | undefined;

    if (eoOffice) {
      const eoFallback =
        eoOffice.phones.length === 0 && eoOffice.fallback_office_id
          ? offices.find((o) => o.id === eoOffice.fallback_office_id)
          : undefined;
      list.push({
        office: eoOffice,
        resolvedRole: "eo",
        additionalChargeNote: eoOffice.post_status === "additional_charge",
        noPhone: eoOffice.phones.length === 0,
      });
      if (eoFallback && eoFallback.phones.length > 0) {
        pushedEoFallbackId = eoFallback.id;
        list.push({
          office: eoFallback,
          resolvedRole: eoFallback.role,
          isFallback: true,
          noPhone: false,
        });
      }
    }

    if (chairmanOffice) {
      list.push({
        office: chairmanOffice,
        resolvedRole: "chairman",
        noPhone: chairmanOffice.phones.length === 0,
      });
    }

    if (wardOffice) {
      list.push({
        office: wardOffice,
        resolvedRole: "ward",
        noPhone: wardOffice.phones.length === 0,
      });
    }

    if (sdmOffice && sdmOffice.id !== pushedEoFallbackId) {
      list.push({
        office: sdmOffice,
        resolvedRole: "sdm",
        noPhone: sdmOffice.phones.length === 0,
      });
    }

    if (cdoOffice) {
      list.push({
        office: cdoOffice,
        resolvedRole: "cdo",
        noPhone: cdoOffice.phones.length === 0,
      });
    }

    if (dmOffice) {
      list.push({
        office: dmOffice,
        resolvedRole: "dm",
        noPhone: dmOffice.phones.length === 0,
      });
    }

    return {
      place,
      officers: list,
      hasCoverageGap: !eoOffice && !chairmanOffice,
      isCantonmentOrOther: false,
      stateHelpline: stateInfo,
    };
  }

  // 4. Nagar Nigam (Mahanagar) Flow
  if (type === "nagar_nigam" || place?.local_body_type === "nagar_nigam") {
    const ulbId = place?.ulb_id;
    const commOffice = ulbId ? findOffice("commissioner", ulbId) : findOffice("commissioner");
    const mayorOffice = ulbId ? findOffice("mayor", ulbId) : findOffice("mayor");
    const wardOffice = ulbId ? findOffice("ward", ulbId) : undefined;

    const list: ResolvedOfficerItem[] = [];

    if (commOffice) {
      list.push({
        office: commOffice,
        resolvedRole: "commissioner",
        noPhone: commOffice.phones.length === 0,
      });
    }

    if (mayorOffice) {
      list.push({
        office: mayorOffice,
        resolvedRole: "mayor",
        noPhone: mayorOffice.phones.length === 0,
      });
    }

    if (wardOffice) {
      list.push({
        office: wardOffice,
        resolvedRole: "ward",
        noPhone: wardOffice.phones.length === 0,
      });
    }

    if (cdoOffice) {
      list.push({
        office: cdoOffice,
        resolvedRole: "cdo",
        noPhone: cdoOffice.phones.length === 0,
      });
    }

    if (dmOffice) {
      list.push({
        office: dmOffice,
        resolvedRole: "dm",
        noPhone: dmOffice.phones.length === 0,
      });
    }

    return {
      place,
      officers: list,
      hasCoverageGap: !commOffice && !mayorOffice,
      isCantonmentOrOther: false,
      stateHelpline: stateInfo,
    };
  }

  // Default fallback for unspecified/unknown
  const defaultList: ResolvedOfficerItem[] = [];
  if (sdmOffice) defaultList.push({ office: sdmOffice, resolvedRole: "sdm" });
  if (cdoOffice) defaultList.push({ office: cdoOffice, resolvedRole: "cdo" });
  if (dmOffice) defaultList.push({ office: dmOffice, resolvedRole: "dm" });

  return {
    place,
    officers: defaultList,
    hasCoverageGap: true,
    isCantonmentOrOther: false,
    stateHelpline: stateInfo,
  };
}
