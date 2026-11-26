import { describe, it, expect } from "vitest";
import { resolveOfficers } from "../lib/resolver";
import {
  getIssueAreaSteps,
  getPrimaryOfficerForIssue,
  getRelevantPortals,
} from "../lib/issue-routing";
import bulandshahrDistrict from "../public/data/districts/bulandshahr.json";
import bulandshahrPlaces from "../public/data/places/bulandshahr.json";
import jaunpurDistrict from "../public/data/districts/jaunpur.json";
import jaunpurPlaces from "../public/data/places/jaunpur.json";
import gbnDistrict from "../public/data/districts/gautam-buddha-nagar.json";
import gbnPlaces from "../public/data/places/gautam-buddha-nagar.json";
import stateData from "../public/data/state.json";
import streetLightIssue from "../public/data/issues/street-light.json";
import handpumpIssue from "../public/data/issues/handpump-water.json";
import drainIssue from "../public/data/issues/drain.json";
import garbageIssue from "../public/data/issues/garbage.json";
import roadIssue from "../public/data/issues/road.json";
import mgnregaIssue from "../public/data/issues/mgnrega.json";
import varanasiDistrict from "../public/data/districts/varanasi.json";
import varanasiPlaces from "../public/data/places/varanasi.json";
import { DistrictData, Issue, Office, Place, StateData } from "../lib/types";

describe("Issue Routing & Urban/Rural/Authority Resolution", () => {
  const bsDistrict = bulandshahrDistrict as unknown as DistrictData;
  const bsPlaces = bulandshahrPlaces as unknown as Place[];
  const jDistrict = jaunpurDistrict as unknown as DistrictData;
  const jPlaces = jaunpurPlaces as unknown as Place[];
  const vDistrict = varanasiDistrict as unknown as DistrictData;
  const vPlaces = varanasiPlaces as unknown as Place[];
  const gbn = gbnDistrict as unknown as DistrictData;
  const gPlaces = gbnPlaces as unknown as Place[];
  const state = stateData as unknown as StateData;

  const sampleVillage = jPlaces.find((p) => p.id.startsWith("lgd-") && p.type === "village")!;

  it("maps urban street-light steps to exact Town EO (Khurja), SDM, and DM", () => {
    const khurjaPlace = bsPlaces.find((p) => p.ulb_id === "ulb-khurja");
    expect(khurjaPlace).toBeDefined();

    const resolution = resolveOfficers(
      khurjaPlace!.local_body_type,
      "bulandshahr",
      khurjaPlace!.id,
      bsDistrict,
      bsPlaces,
      state
    );
    const { steps, isUrbanFlow } = getIssueAreaSteps(
      streetLightIssue as Issue,
      khurjaPlace!.local_body_type,
      resolution
    );

    expect(isUrbanFlow).toBe(true);
    expect(steps[0].step.role).toBe("eo");
    expect(steps[0].resolvedOfficer?.office.id).toBe("up-bulandshahr-eo-khurja");
    expect(steps[0].resolvedOfficer?.office.phones[0].number).toBe("8189077914");

    const primary = getPrimaryOfficerForIssue("street-light", resolution);
    expect(primary?.office.id).toBe("up-bulandshahr-eo-khurja");

    const portals = getRelevantPortals("street-light", khurjaPlace!.local_body_type, state);
    expect(portals.some((p) => p.id === "e-nagarsewa")).toBe(true);
  });

  it("aligns Hero Primary Officer with Step 01 (BDO) and omits dead phoneless ADO step on rural handpump & drain for real LGD villages", () => {
    const resolution = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      sampleVillage.id,
      jDistrict,
      jPlaces,
      state
    );

    for (const iss of [handpumpIssue as Issue, drainIssue as Issue]) {
      const { steps, isUrbanFlow } = getIssueAreaSteps(iss, "gram_panchayat", resolution);
      expect(isUrbanFlow).toBe(false);
      expect(steps[0].step.role).toBe("bdo");
      expect(steps[0].resolvedOfficer?.resolvedRole).toBe("bdo");
      expect(steps.some((s) => s.step.role === "ado_panchayat" && s.resolvedOfficer?.noPhone)).toBe(false);

      const primary = getPrimaryOfficerForIssue(iss.slug, resolution);
      expect(primary?.office.id).toBe(steps[0].resolvedOfficer?.office.id);
    }

    const portals = getRelevantPortals("handpump-water", "gram_panchayat", state);
    expect(portals[0]?.id).toBe("jalsamadhan");
  });

  it("maps rural handpump Step 01 and Primary Officer both to filled Secretary when GP Secretary exists", () => {
    const gpId = sampleVillage.gp_id || "gp-filled-test";
    const secOffice: Office = {
      id: "up-jaunpur-sec-test",
      level: "gram_panchayat",
      role: "secretary",
      office_name_en: "Gram Panchayat Secretary, Test GP",
      office_name_hi: "ग्राम पंचायत सचिव, टेस्ट",
      phones: [
        {
          number: "9450008800",
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

    const withSec: DistrictData = { ...jDistrict, offices: [secOffice, ...jDistrict.offices] };
    const resolution = resolveOfficers("gram_panchayat", "jaunpur", sampleVillage.id, withSec, jPlaces, state);
    const { steps } = getIssueAreaSteps(handpumpIssue as Issue, "gram_panchayat", resolution);
    const primary = getPrimaryOfficerForIssue("handpump-water", resolution);

    expect(steps[0].step.role).toBe("secretary");
    expect(steps[0].resolvedOfficer?.office.covers).toContain(gpId);
    expect(primary?.office.id).toBe(secOffice.id);
  });

  it("routes Noida authority_area civic issues to NOIDA Authority -> SDM -> DM and marks MGNREGA rural-only", () => {
    const noida = gPlaces.find((p) => p.id === "lgd-ulb-301210")!;
    const resolution = resolveOfficers(
      "authority_area",
      "gautam-buddha-nagar",
      noida.id,
      gbn,
      gPlaces,
      state
    );

    const { steps, isUrbanFlow, isRuralOnlyNotice } = getIssueAreaSteps(
      streetLightIssue as Issue,
      noida.local_body_type,
      resolution
    );
    expect(isUrbanFlow).toBe(false);
    expect(isRuralOnlyNotice).toBe(false);
    expect(steps[0].resolvedOfficer?.office.id).toBe(
      "up-gautam-buddha-nagar-eo-new-okhla-industrial-development-authority"
    );
    expect(steps[1].step.role).toBe("sdm");
    expect(steps[2].step.role).toBe("dm");

    const primary = getPrimaryOfficerForIssue("street-light", resolution);
    expect(primary?.office.id).toBe(steps[0].resolvedOfficer?.office.id);

    const mgnregaRes = getIssueAreaSteps(
      mgnregaIssue as Issue,
      noida.local_body_type,
      resolution
    );
    expect(mgnregaRes.isRuralOnlyNotice).toBe(true);
  });

  it("flags MGNREGA urban mismatch cleanly when an urban ward is selected", () => {
    const khurjaPlace = bsPlaces.find((p) => p.ulb_id === "ulb-khurja")!;
    const resolution = resolveOfficers(
      khurjaPlace.local_body_type,
      "bulandshahr",
      khurjaPlace.id,
      bsDistrict,
      bsPlaces,
      state
    );
    const { isRuralOnlyNotice } = getIssueAreaSteps(
      mgnregaIssue as Issue,
      khurjaPlace.local_body_type,
      resolution
    );
    expect(isRuralOnlyNotice).toBe(true);
  });

  it("includes Sub-Divisional Magistrate (SDM) in escalation ladders across all 6 rural issues and Varanasi Nagar Nigam", () => {
    const ruralResolution = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      sampleVillage.id,
      jDistrict,
      jPlaces,
      state
    );

    const allIssues = [
      streetLightIssue as Issue,
      drainIssue as Issue,
      garbageIssue as Issue,
      handpumpIssue as Issue,
      roadIssue as Issue,
      mgnregaIssue as Issue,
    ];

    for (const iss of allIssues) {
      const { steps, isRuralOnlyNotice } = getIssueAreaSteps(iss, "gram_panchayat", ruralResolution);
      expect(isRuralOnlyNotice).toBe(false);
      const sdmStep = steps.find((s) => s.step.role === "sdm");
      expect(sdmStep, `${iss.slug} rural ladder must include sdm`).toBeDefined();
      expect(sdmStep?.resolvedOfficer?.resolvedRole).toBe("sdm");
      expect(sdmStep?.resolvedOfficer?.office.phones.length).toBeGreaterThan(0);
    }

    const varanasiNigamWard = vPlaces.find((p) => p.local_body_type === "nagar_nigam")!;
    const nigamResolution = resolveOfficers(
      "nagar_nigam",
      "varanasi",
      varanasiNigamWard.id,
      vDistrict,
      vPlaces,
      state
    );
    const { steps: nigamSteps } = getIssueAreaSteps(
      drainIssue as Issue,
      "nagar_nigam",
      nigamResolution
    );
    expect(nigamSteps[0].step.role).toBe("commissioner");
    expect(nigamSteps[1].step.role).toBe("sdm");
    expect(nigamSteps[1].resolvedOfficer?.resolvedRole).toBe("sdm");
    expect(nigamSteps[2].step.role).toBe("dm");
  });
});
