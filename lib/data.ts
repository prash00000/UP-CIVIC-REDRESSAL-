import {
  DistrictIndexEntry,
  DistrictData,
  Place,
  PincodeMap,
  StateData,
  Issue,
} from "./types";

export async function loadDistrictsIndex(): Promise<DistrictIndexEntry[]> {
  try {
    const res = await fetch("/data/districts.json");
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to load districts.json", err);
    return [];
  }
}

export async function loadDistrictData(districtId: string): Promise<DistrictData | null> {
  try {
    const res = await fetch(`/data/districts/${districtId}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Failed to load district data for ${districtId}`, err);
    return null;
  }
}

export async function loadPlacesData(districtId: string): Promise<Place[]> {
  if (!districtId) {
    return [];
  }
  try {
    const res = await fetch(`/data/places/${districtId}.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(`Failed to load places for ${districtId}`, err);
    return [];
  }
}

export async function loadPincodes(): Promise<PincodeMap> {
  try {
    const res = await fetch("/data/pincodes.json");
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    console.error("Failed to load pincodes.json", err);
    return {};
  }
}

export async function loadStateData(): Promise<StateData | null> {
  try {
    const res = await fetch("/data/state.json");
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to load state.json", err);
    return null;
  }
}

export async function loadIssue(slug: string): Promise<Issue | null> {
  try {
    const res = await fetch(`/data/issues/${slug}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Failed to load issue ${slug}`, err);
    return null;
  }
}
