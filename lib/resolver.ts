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
  isRecheckFlagged?: boolean;
};

export type ResolutionResult = {
  place: Place | null;
  officers: ResolvedOfficerItem[];
  hasCoverageGap: boolean;
  isCantonmentOrOther: boolean;
  secretaryNotIndexed?: boolean;
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
  stateData?: StateData,
  recheckOfficeIds?: Set<string>
): ResolutionResult {
  const offices = districtData.offices || [];
  const place = placeId ? placesList.find((p) => p.id === placeId) || null : null;

  const makeItem = (
    office: Office,
    resolvedRole: OfficeRole,
    extra: Partial<Omit<ResolvedOfficerItem, "office" | "resolvedRole">> = {}
  ): ResolvedOfficerItem => ({
    office,
    resolvedRole,
    noPhone: office.phones.length === 0,
    isRecheckFlagged: recheckOfficeIds ? recheckOfficeIds.has(office.id) : false,
    ...extra,
  });

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
    const seenIds = new Set<string>();

    // Exact ULB coverage match first (e.g. Noida, GNIDA, YEIDA, specific Cantonment)
    let specialOffice: Office | undefined = place?.ulb_id
      ? offices.find((o) => o.covers.includes(place.ulb_id!))
      : undefined;

    if (
      !specialOffice &&
      (type === "cantonment_board" || place?.local_body_type === "cantonment_board")
    ) {
      specialOffice = offices.find((o) =>
        o.office_name_en.toLowerCase().includes("cantonment")
      );
    }

    if (specialOffice) {
      seenIds.add(specialOffice.id);
      list.push(makeItem(specialOffice, specialOffice.role));
      if (specialOffice.phones.length === 0 && specialOffice.fallback_office_id) {
        const fb = offices.find((o) => o.id === specialOffice!.fallback_office_id);
        if (fb && fb.phones.length > 0 && !seenIds.has(fb.id)) {
          seenIds.add(fb.id);
          list.push(makeItem(fb, fb.role, { isFallback: true }));
        }
      }
    }

    if (sdmOffice && !seenIds.has(sdmOffice.id)) {
      seenIds.add(sdmOffice.id);
      list.push(makeItem(sdmOffice, "sdm"));
    }
    if (cdoOffice && !seenIds.has(cdoOffice.id)) {
      seenIds.add(cdoOffice.id);
      list.push(makeItem(cdoOffice, "cdo"));
    }
    if (dmOffice && !seenIds.has(dmOffice.id)) {
      seenIds.add(dmOffice.id);
      list.push(makeItem(dmOffice, "dm"));
    }

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

    // Check Coverage Gap: Block level data is missing
    const hasCoverageGap = !bdoOffice && !adoOffice;

    const list: ResolvedOfficerItem[] = [];
    const seenIds = new Set<string>();

    // Secretary resolution
    const secretaryOffice = gpId ? findOffice("secretary", gpId) : undefined;
    let secretaryNotIndexed = false;

    if (secretaryOffice && secretaryOffice.post_status === "vacant") {
      // Secretary post explicitly marked vacant -> resolve once to fallback office without duplicating
      const fallbackId = secretaryOffice.fallback_office_id;
      const fallbackOffice = fallbackId
        ? offices.find((o) => o.id === fallbackId)
        : adoOffice || bdoOffice;

      if (fallbackOffice) {
        seenIds.add(fallbackOffice.id);
        list.push(
          makeItem(fallbackOffice, "secretary", {
            isVacant: true,
            isFallback: true,
          })
        );
      }
      if (adoOffice && !seenIds.has(adoOffice.id)) {
        seenIds.add(adoOffice.id);
        list.push(makeItem(adoOffice, "ado_panchayat"));
      }
      if (bdoOffice && !seenIds.has(bdoOffice.id)) {
        seenIds.add(bdoOffice.id);
        list.push(makeItem(bdoOffice, "bdo"));
      }
    } else if (secretaryOffice) {
      seenIds.add(secretaryOffice.id);
      list.push(
        makeItem(secretaryOffice, "secretary", {
          additionalChargeNote: secretaryOffice.post_status === "additional_charge",
        })
      );
      if (adoOffice && !seenIds.has(adoOffice.id)) {
        seenIds.add(adoOffice.id);
        list.push(makeItem(adoOffice, "ado_panchayat"));
      }
      if (bdoOffice && !seenIds.has(bdoOffice.id)) {
        seenIds.add(bdoOffice.id);
        list.push(makeItem(bdoOffice, "bdo"));
      }
    } else {
      // Statewide real LGD case: GP Secretary directory is not published centrally.
      // Present verified BDO first instead of fabricating a vacant Secretary banner or double ADO card.
      secretaryNotIndexed = true;
      if (bdoOffice && !seenIds.has(bdoOffice.id)) {
        seenIds.add(bdoOffice.id);
        list.push(makeItem(bdoOffice, "bdo"));
      }
      if (adoOffice && !seenIds.has(adoOffice.id)) {
        seenIds.add(adoOffice.id);
        list.push(makeItem(adoOffice, "ado_panchayat"));
      }
    }

    if (dproOffice && !seenIds.has(dproOffice.id)) {
      seenIds.add(dproOffice.id);
      list.push(makeItem(dproOffice, "dpro"));
    }

    if (tehsildarOffice && !seenIds.has(tehsildarOffice.id)) {
      seenIds.add(tehsildarOffice.id);
      list.push(makeItem(tehsildarOffice, "tehsildar"));
    }
    if (sdmOffice && !seenIds.has(sdmOffice.id)) {
      seenIds.add(sdmOffice.id);
      list.push(makeItem(sdmOffice, "sdm"));
    }

    if (cdoOffice && !seenIds.has(cdoOffice.id)) {
      seenIds.add(cdoOffice.id);
      list.push(makeItem(cdoOffice, "cdo"));
    }

    if (dmOffice && !seenIds.has(dmOffice.id)) {
      seenIds.add(dmOffice.id);
      list.push(makeItem(dmOffice, "dm"));
    }

    return {
      place,
      officers: list,
      hasCoverageGap,
      isCantonmentOrOther: false,
      secretaryNotIndexed,
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
      list.push(
        makeItem(eoOffice, "eo", {
          additionalChargeNote: eoOffice.post_status === "additional_charge",
        })
      );
      if (eoFallback && eoFallback.phones.length > 0) {
        pushedEoFallbackId = eoFallback.id;
        list.push(makeItem(eoFallback, eoFallback.role, { isFallback: true }));
      }
    }

    if (chairmanOffice) {
      list.push(makeItem(chairmanOffice, "chairman"));
    }

    if (wardOffice) {
      list.push(makeItem(wardOffice, "ward"));
    }

    if (sdmOffice && sdmOffice.id !== pushedEoFallbackId) {
      list.push(makeItem(sdmOffice, "sdm"));
    }

    if (cdoOffice) {
      list.push(makeItem(cdoOffice, "cdo"));
    }

    if (dmOffice) {
      list.push(makeItem(dmOffice, "dm"));
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
      list.push(makeItem(commOffice, "commissioner"));
    }

    if (mayorOffice) {
      list.push(makeItem(mayorOffice, "mayor"));
    }

    if (wardOffice) {
      list.push(makeItem(wardOffice, "ward"));
    }

    if (sdmOffice) {
      list.push(makeItem(sdmOffice, "sdm"));
    }

    if (cdoOffice) {
      list.push(makeItem(cdoOffice, "cdo"));
    }

    if (dmOffice) {
      list.push(makeItem(dmOffice, "dm"));
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
  if (sdmOffice) defaultList.push(makeItem(sdmOffice, "sdm"));
  if (cdoOffice) defaultList.push(makeItem(cdoOffice, "cdo"));
  if (dmOffice) defaultList.push(makeItem(dmOffice, "dm"));

  return {
    place,
    officers: defaultList,
    hasCoverageGap: true,
    isCantonmentOrOther: false,
    stateHelpline: stateInfo,
  };
}
