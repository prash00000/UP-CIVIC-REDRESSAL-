import { describe, it, expect } from "vitest";
import { resolveOfficers } from "../lib/resolver";
import jaunpurDistrict from "../public/data/districts/jaunpur.json";
import jaunpurPlaces from "../public/data/places/jaunpur.json";
import varanasiDistrict from "../public/data/districts/varanasi.json";
import varanasiPlaces from "../public/data/places/varanasi.json";
import stateData from "../public/data/state.json";
import { DistrictData, Place, StateData } from "../lib/types";

describe("Officer Resolver Unit Tests (Official UP Pilot Data)", () => {
  const jaunpur = jaunpurDistrict as unknown as DistrictData;
  const jPlaces = jaunpurPlaces as unknown as Place[];
  const varanasi = varanasiDistrict as unknown as DistrictData;
  const vPlaces = varanasiPlaces as unknown as Place[];
  const state = stateData as unknown as StateData;

  it("should resolve filled secretary for a standard rural village in Jaunpur", () => {
    // Village 1 in first block
    const village = jPlaces[0];
    const result = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      village.id,
      jaunpur,
      jPlaces,
      state
    );

    expect(result.place?.id).toBe(village.id);
    expect(result.hasCoverageGap).toBe(false);
    expect(result.isCantonmentOrOther).toBe(false);

    const roles = result.officers.map((o) => o.resolvedRole);
    expect(roles).toContain("secretary");
    expect(roles).toContain("ado_panchayat");
    expect(roles).toContain("bdo");
    expect(roles).toContain("dpro");
    expect(roles).toContain("sdm");
    expect(roles).toContain("cdo");
    expect(roles).toContain("dm");

    const sec = result.officers.find((o) => o.resolvedRole === "secretary");
    expect(sec?.isVacant).toBeFalsy();
    expect(sec?.office.post_status).toBe("filled");
  });

  it("should fallback to ADO/BDO and mark vacant when secretary post is vacant", () => {
    // Village 2 has vacant secretary
    const village = jPlaces[1];
    const result = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      village.id,
      jaunpur,
      jPlaces,
      state
    );

    const sec = result.officers.find((o) => o.resolvedRole === "secretary");
    expect(sec).toBeDefined();
    expect(sec?.isVacant).toBe(true);
    expect(sec?.isFallback).toBe(true);
    expect(sec?.office.role).toBe("ado_panchayat"); // fallback to ADO
  });

  it("should detect coverage gap when block-level data is missing and still return DM/CDO/SDM", () => {
    // A synthetic remote village with nonexistent block ID
    const remotePlace: Place = {
      id: "v-remote-missing",
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

  it("should resolve nagar_nigam path with Municipal Commissioner, CDO, DM in Varanasi", () => {
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
    expect(roles).toContain("cdo");
    expect(roles).toContain("dm");
  });

  it("should handle cantonment or authority areas properly", () => {
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
});
