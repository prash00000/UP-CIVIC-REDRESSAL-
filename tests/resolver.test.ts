import { describe, it, expect } from "vitest";
import { resolveOfficers } from "../lib/resolver";
import jaunpurDistrict from "../public/data/districts/jaunpur.json";
import jaunpurPlaces from "../public/data/places/jaunpur.json";
import varanasiDistrict from "../public/data/districts/varanasi.json";
import varanasiPlaces from "../public/data/places/varanasi.json";
import gbnDistrict from "../public/data/districts/gautam-buddha-nagar.json";
import gbnPlaces from "../public/data/places/gautam-buddha-nagar.json";
import stateData from "../public/data/state.json";
import { DistrictData, Office, Place, StateData } from "../lib/types";

describe("Officer Resolver Unit Tests (Official UP Data + Statutory Fixtures)", () => {
  const jaunpur = jaunpurDistrict as unknown as DistrictData;
  const jPlaces = jaunpurPlaces as unknown as Place[];
  const varanasi = varanasiDistrict as unknown as DistrictData;
  const vPlaces = varanasiPlaces as unknown as Place[];
  const gbn = gbnDistrict as unknown as DistrictData;
  const gPlaces = gbnPlaces as unknown as Place[];
  const state = stateData as unknown as StateData;

  const sampleVillage = jPlaces.find((p) => p.id.startsWith("lgd-") && p.type === "village")!;
  const sampleBdo = jaunpur.offices.find(
    (o) => o.role === "bdo" && o.covers.includes(sampleVillage.block_id!)
  )!;

  it("should resolve verified BDO first and set secretaryNotIndexed=true (no fake vacant banner or double ADO) for real UP LGD village", () => {
    const result = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      sampleVillage.id,
      jaunpur,
      jPlaces,
      state
    );

    expect(result.place?.id).toBe(sampleVillage.id);
    expect(result.hasCoverageGap).toBe(false);
    expect(result.isCantonmentOrOther).toBe(false);
    expect(result.secretaryNotIndexed).toBe(true);

    const roles = result.officers.map((o) => o.resolvedRole);
    expect(roles[0]).toBe("bdo");
    expect(roles).not.toContain("secretary");
    expect(roles).toContain("dpro");
    expect(roles).toContain("sdm");
    expect(roles).toContain("cdo");
    expect(roles).toContain("dm");

    // Ensure no office ID appears twice (e.g. duplicate ADO fallback)
    const ids = result.officers.map((o) => o.office.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should resolve filled secretary for a rural GP when Secretary record exists", () => {
    const gpId = sampleVillage.gp_id || "gp-inline-1";
    const filledSecOffice: Office = {
      id: "up-jaunpur-sec-inline-filled",
      level: "gram_panchayat",
      role: "secretary",
      office_name_en: "Gram Panchayat Secretary, Inline Village",
      office_name_hi: "ग्राम पंचायत सचिव, इनलाइन ग्राम",
      phones: [
        {
          number: "9450009901",
          type: "cug",
          source_url: "https://jaunpur.nic.in",
          checked_on: "2026-11-25",
          status: "verified",
        },
      ],
      post_status: "filled",
      covers: [gpId],
      source_url: "https://jaunpur.nic.in",
      confidence: "high",
      valid_as_of: "2026-11-25",
    };

    const inlineDistrict: DistrictData = {
      ...jaunpur,
      offices: [filledSecOffice, ...jaunpur.offices],
    };

    const result = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      sampleVillage.id,
      inlineDistrict,
      jPlaces,
      state
    );

    expect(result.secretaryNotIndexed).toBe(false);
    const sec = result.officers.find((o) => o.resolvedRole === "secretary");
    expect(sec?.isVacant).toBeFalsy();
    expect(sec?.office.post_status).toBe("filled");
    expect(sec?.office.phones[0].number).toBe("9450009901");
  });

  it("should fallback once to ADO/BDO and mark vacant when secretary post is explicitly vacant (without duplicating ADO)", () => {
    const gpId = sampleVillage.gp_id || "gp-inline-vacant";
    const adoOffice: Office = {
      id: "up-jaunpur-ado-inline",
      level: "block",
      role: "ado_panchayat",
      office_name_en: `ADO (Panchayat), ${sampleVillage.block_id}`,
      office_name_hi: `सहायक विकास अधिकारी (पंचायत), ${sampleVillage.block_id}`,
      phones: [],
      covers: [sampleVillage.block_id!],
      source_url: "https://jaunpur.nic.in",
      confidence: "medium",
      valid_as_of: "2026-11-25",
    };
    const vacantSecOffice: Office = {
      id: "up-jaunpur-sec-inline-vacant",
      level: "gram_panchayat",
      role: "secretary",
      office_name_en: "Gram Panchayat Secretary (Vacant)",
      office_name_hi: "ग्राम पंचायत सचिव (रिक्त)",
      phones: [],
      post_status: "vacant",
      fallback_office_id: adoOffice.id,
      covers: [gpId],
      source_url: "https://jaunpur.nic.in",
      confidence: "high",
      valid_as_of: "2026-11-25",
    };

    const inlineDistrict: DistrictData = {
      ...jaunpur,
      offices: [vacantSecOffice, adoOffice, ...jaunpur.offices],
    };

    const result = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      sampleVillage.id,
      inlineDistrict,
      jPlaces,
      state
    );

    const sec = result.officers.find((o) => o.resolvedRole === "secretary");
    expect(sec).toBeDefined();
    expect(sec?.isVacant).toBe(true);
    expect(sec?.isFallback).toBe(true);
    expect(sec?.office.id).toBe(adoOffice.id);

    // Ensure ADO fallback is NOT duplicated a second time as an ado_panchayat card
    const adoCount = result.officers.filter((o) => o.office.id === adoOffice.id).length;
    expect(adoCount).toBe(1);
    expect(result.officers.some((o) => o.office.id === sampleBdo.id)).toBe(true);
  });

  it("should detect coverage gap when block-level data is missing and still return DM/CDO/SDM", () => {
    const remotePlace: Place = {
      id: "remote-missing-block",
      type: "village",
      name_en: "Remote Village",
      name_hi: "दूरस्थ गाँव",
      gp_id: "gp-nonexistent",
      block_id: "block-nonexistent",
      tehsil_id: "sadar",
      district_id: "jaunpur",
      local_body_type: "gram_panchayat",
    };

    const result = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      remotePlace.id,
      jaunpur,
      [remotePlace],
      state
    );

    expect(result.hasCoverageGap).toBe(true);
    const roles = result.officers.map((o) => o.resolvedRole);
    expect(roles).toContain("sdm");
    expect(roles).toContain("cdo");
    expect(roles).toContain("dm");
    expect(result.stateHelpline.number).toBe("1076");
  });

  it("should resolve nagar_nigam path with Municipal Commissioner, SDM, CDO, DM in Varanasi", () => {
    const ward = vPlaces.find((p) => p.local_body_type === "nagar_nigam");
    const result = resolveOfficers(
      "nagar_nigam",
      "varanasi",
      ward?.id,
      varanasi,
      vPlaces,
      state
    );

    const roles = result.officers.map((o) => o.resolvedRole);
    expect(roles).toContain("commissioner");
    expect(roles).toContain("sdm");
    expect(roles).toContain("cdo");
    expect(roles).toContain("dm");
  });

  it("should resolve authority_area Noida in Gautam Buddha Nagar to NOIDA Authority office cleanly", () => {
    const noida = gPlaces.find((p) => p.id === "lgd-ulb-301210")!;
    expect(noida).toBeDefined();
    expect(noida.local_body_type).toBe("authority_area");
    expect(noida.ulb_id).toBe("ulb-new-okhla-industrial-development-authority");

    const result = resolveOfficers(
      "authority_area",
      "gautam-buddha-nagar",
      noida.id,
      gbn,
      gPlaces,
      state
    );

    expect(result.isCantonmentOrOther).toBe(true);
    expect(result.officers[0].office.id).toBe(
      "up-gautam-buddha-nagar-eo-new-okhla-industrial-development-authority"
    );
    expect(result.officers[0].office.phones[0].number).toBe("0120-2425025");
    expect(result.officers.map((o) => o.resolvedRole)).toContain("dm");
  });

  it("should handle cantonment areas properly", () => {
    const canttPlace: Place = {
      id: "cantt-1",
      type: "ward",
      name_en: "Varanasi Cantonment",
      name_hi: "वाराणसी छावनी",
      ulb_id: "cantt-board",
      tehsil_id: "varanasi-sadar",
      district_id: "varanasi",
      local_body_type: "cantonment_board",
    };

    const result = resolveOfficers(
      "other",
      "varanasi",
      canttPlace.id,
      varanasi,
      [canttPlace],
      state
    );

    expect(result.isCantonmentOrOther).toBe(true);
    const roles = result.officers.map((o) => o.resolvedRole);
    expect(roles).toContain("sdm");
    expect(roles).toContain("cdo");
    expect(roles).toContain("dm");
    expect(result.stateHelpline.number).toBe("1076");
  });

  it("should attach supervising fallback office when Town EO is under additional_charge without direct phone", () => {
    const syntheticDistrict: DistrictData = {
      ...jaunpur,
      offices: [
        ...jaunpur.offices,
        {
          id: "up-jaunpur-eo-primary",
          level: "ulb",
          role: "eo",
          office_name_en: "Executive Officer, Town Primary",
          office_name_hi: "अधिशासी अधिकारी, मुख्य नगर",
          phones: [
            {
              number: "9450001111",
              type: "cug",
              source_url: "https://jaunpur.nic.in",
              checked_on: "2026-11-25",
              status: "verified",
            },
          ],
          covers: ["ulb-primary"],
          source_url: "https://jaunpur.nic.in",
          confidence: "high",
          valid_as_of: "2026-11-25",
        },
        {
          id: "up-jaunpur-eo-joint",
          level: "ulb",
          role: "eo",
          office_name_en: "Executive Officer, Town Joint",
          office_name_hi: "अधिशासी अधिकारी, संयुक्त नगर",
          phones: [],
          post_status: "additional_charge",
          fallback_office_id: "up-jaunpur-eo-primary",
          covers: ["ulb-joint"],
          source_url: "https://jaunpur.nic.in",
          confidence: "medium",
          valid_as_of: "2026-11-25",
        },
      ],
    };
    const jointPlace: Place = {
      id: "ward-joint",
      type: "ward",
      name_en: "Town Joint (All Wards)",
      name_hi: "संयुक्त नगर (सभी वार्ड)",
      ulb_id: "ulb-joint",
      tehsil_id: jaunpur.offices.find((o) => o.role === "sdm")?.covers[0] || "sadar",
      district_id: "jaunpur",
      local_body_type: "nagar_panchayat",
    };
    const result = resolveOfficers("nagar_panchayat", "jaunpur", jointPlace.id, syntheticDistrict, [jointPlace], state);
    expect(result.officers[0].office.id).toBe("up-jaunpur-eo-joint");
    expect(result.officers[0].additionalChargeNote).toBe(true);
    expect(result.officers[1].office.id).toBe("up-jaunpur-eo-primary");
    expect(result.officers[1].isFallback).toBe(true);
    expect(result.officers[1].noPhone).toBe(false);
  });

  it("should flag offices matching recheckOfficeIds cleanly", () => {
    const dmOffice = jaunpur.offices.find((o) => o.role === "dm")!;
    const result = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      sampleVillage.id,
      jaunpur,
      jPlaces,
      state,
      new Set([dmOffice.id])
    );
    const dmItem = result.officers.find((o) => o.office.id === dmOffice.id);
    const bdoItem = result.officers.find((o) => o.resolvedRole === "bdo");
    expect(dmItem?.isRecheckFlagged).toBe(true);
    expect(bdoItem?.isRecheckFlagged).toBe(false);
  });
});
