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
import stateData from "../public/data/state.json";
import streetLightIssue from "../public/data/issues/street-light.json";
import handpumpIssue from "../public/data/issues/handpump-water.json";
import mgnregaIssue from "../public/data/issues/mgnrega.json";
import { DistrictData, Issue, Place, StateData } from "../lib/types";

describe("Issue Routing & Urban/Rural Resolution", () => {
  const bsDistrict = bulandshahrDistrict as unknown as DistrictData;
  const bsPlaces = bulandshahrPlaces as unknown as Place[];
  const jDistrict = jaunpurDistrict as unknown as DistrictData;
  const jPlaces = jaunpurPlaces as unknown as Place[];
  const state = stateData as unknown as StateData;

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

  it("maps rural handpump issue in Jaunpur to exact Village/Block officers and Jal Samadhan portal", () => {
    const village = jPlaces[0];
    const resolution = resolveOfficers(
      "gram_panchayat",
      "jaunpur",
      village.id,
      jDistrict,
      jPlaces,
      state
    );
    const { steps, isUrbanFlow } = getIssueAreaSteps(
      handpumpIssue as Issue,
      "gram_panchayat",
      resolution
    );

    expect(isUrbanFlow).toBe(false);
    expect(steps[0].step.role).toBe("secretary");
    expect(steps[0].resolvedOfficer?.office.covers).toContain(village.gp_id);

    const portals = getRelevantPortals("handpump-water", "gram_panchayat", state);
    expect(portals[0]?.id).toBe("jalsamadhan");
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
});
