"use client";

import { useState, useEffect, useMemo } from "react";
import { PincodeMap } from "./types";
import { resolvePincode, PincodeMatch } from "./pincode";

export interface EnhancedPincodeState {
  kind: "idle" | "exact" | "live" | "prefix" | "out_of_state" | "not_found";
  matches: PincodeMatch[];
  localitySummary: string;
  outOfStateInfo: { district: string; state: string } | null;
  isCheckingLive: boolean;
}

/**
 * Instant client-side 1,653-PIN + prefix resolver with automatic
 * live India Post `/api/pincode` fallback & out-of-state clarification.
 */
export function usePincodeLookup(
  rawPin: string,
  pincodesMap: PincodeMap
): EnhancedPincodeState {
  const cleanPin = rawPin.replace(/\D/g, "").slice(0, 6);
  const localLoaded = Object.keys(pincodesMap).length > 0;

  const localRes = useMemo(() => {
    if (cleanPin.length !== 6 || !localLoaded) return null;
    return resolvePincode(cleanPin, pincodesMap);
  }, [cleanPin, localLoaded, pincodesMap]);

  const [liveData, setLiveData] = useState<{
    pin: string;
    status: string;
    matches: PincodeMatch[];
    localitySummary?: string;
    district?: string;
    state?: string;
  } | null>(null);
  const [checkingPin, setCheckingPin] = useState<string | null>(null);

  useEffect(() => {
    if (cleanPin.length !== 6 || !localLoaded) {
      setLiveData(null);
      setCheckingPin(null);
      return;
    }

    // No network request needed if we already have an exact local India Post match
    if (localRes && localRes.kind === "exact") {
      setLiveData(null);
      setCheckingPin(null);
      return;
    }

    let cancelled = false;
    setCheckingPin(cleanPin);

    fetch(`/api/pincode/?pin=${encodeURIComponent(cleanPin)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.pin === cleanPin) {
          setLiveData(data);
        }
      })
      .catch(() => {
        // Offline or network issue: gracefully keep local prefix/not_found result
      })
      .finally(() => {
        if (!cancelled) setCheckingPin(null);
      });

    return () => {
      cancelled = true;
    };
  }, [cleanPin, localLoaded, localRes]);

  return useMemo(() => {
    if (cleanPin.length !== 6 || !localLoaded || !localRes) {
      return {
        kind: "idle",
        matches: [],
        localitySummary: "",
        outOfStateInfo: null,
        isCheckingLive: false,
      };
    }

    if (localRes.kind === "exact") {
      return {
        kind: "exact",
        matches: localRes.matches,
        localitySummary: localRes.matches
          .map((m) => m.locality_en)
          .filter(Boolean)
          .join(" | "),
        outOfStateInfo: null,
        isCheckingLive: false,
      };
    }

    const activeLive = liveData && liveData.pin === cleanPin ? liveData : null;
    if (activeLive) {
      if (activeLive.status === "up_live" && activeLive.matches.length > 0) {
        return {
          kind: "live",
          matches: activeLive.matches,
          localitySummary: activeLive.localitySummary || "",
          outOfStateInfo: null,
          isCheckingLive: false,
        };
      }
      if (activeLive.status === "out_of_state") {
        return {
          kind: "out_of_state",
          matches: [],
          localitySummary: "",
          outOfStateInfo: {
            district: activeLive.district || "",
            state: activeLive.state || "",
          },
          isCheckingLive: false,
        };
      }
    }

    if (localRes.kind === "prefix") {
      return {
        kind: "prefix",
        matches: localRes.matches,
        localitySummary: "",
        outOfStateInfo: null,
        isCheckingLive: checkingPin === cleanPin,
      };
    }

    return {
      kind: "not_found",
      matches: [],
      localitySummary: "",
      outOfStateInfo: null,
      isCheckingLive: checkingPin === cleanPin,
    };
  }, [cleanPin, localLoaded, localRes, liveData, checkingPin]);
}
