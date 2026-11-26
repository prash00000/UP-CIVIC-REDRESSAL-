import { LocalBodyType } from "./types";

export const SAVED_AREA_STORAGE_KEY = "up-civic-saved-area-v1";

export interface SavedArea {
  districtId: string;
  districtNameEn: string;
  districtNameHi: string;
  placeId: string;
  placeNameEn: string;
  placeNameHi: string;
  localBodyType: LocalBodyType | "unknown" | "other";
  pincode?: string;
  savedAt: string;
}

export function readSavedArea(): SavedArea | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVED_AREA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedArea>;
    if (!parsed || typeof parsed.districtId !== "string" || typeof parsed.placeId !== "string") {
      return null;
    }
    return {
      districtId: parsed.districtId,
      districtNameEn: parsed.districtNameEn || parsed.districtId,
      districtNameHi: parsed.districtNameHi || parsed.districtId,
      placeId: parsed.placeId,
      placeNameEn: parsed.placeNameEn || parsed.placeId,
      placeNameHi: parsed.placeNameHi || parsed.placeId,
      localBodyType: parsed.localBodyType || "unknown",
      pincode: parsed.pincode,
      savedAt: parsed.savedAt || "",
    };
  } catch {
    return null;
  }
}

export function saveArea(area: Omit<SavedArea, "savedAt">): SavedArea | null {
  const payload: SavedArea = {
    ...area,
    savedAt: new Date().toISOString().slice(0, 10),
  };
  if (typeof window === "undefined") return payload;
  try {
    window.localStorage.setItem(SAVED_AREA_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore private mode / quota errors cleanly
  }
  return payload;
}

export function clearSavedArea(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVED_AREA_STORAGE_KEY);
  } catch {
    // Ignore storage errors cleanly
  }
}
