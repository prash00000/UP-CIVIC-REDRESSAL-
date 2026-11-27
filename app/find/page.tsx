"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Divider } from "@astryxdesign/core/Divider";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import {
  LocalBodyType,
  DistrictIndexEntry,
  DistrictData,
  Place,
  PincodeMap,
  StateData,
  Issue,
  IssueSlug,
} from "@/lib/types";
import { resolvePincode } from "@/lib/pincode";
import { usePincodeLookup } from "@/lib/usePincodeLookup";
import {
  loadDistrictsIndex,
  loadDistrictData,
  loadPlacesData,
  loadPincodes,
  loadStateData,
  loadRecheckOffices,
  loadIssue,
} from "@/lib/data";
import { resolveOfficers, ResolutionResult } from "@/lib/resolver";
import {
  ISSUE_LIST,
  getPrimaryOfficerForIssue,
  getRelevantPortals,
} from "@/lib/issue-routing";
import {
  formatPlaceBlockAndTehsil,
  formatPlaceSublabel,
  getPlaceBlockLabel,
} from "@/lib/place-display";
import { saveArea, clearSavedArea, readSavedArea, SavedArea } from "@/lib/saved-area";
import { build1076ComplaintSummary } from "@/lib/complaint-summary";
import Stepper from "@/components/Stepper";
import ChoiceButton from "@/components/ChoiceButton";
import SearchSelect, { SearchOption } from "@/components/SearchSelect";
import OfficerCard from "@/components/OfficerCard";
import CallButton from "@/components/CallButton";
import CoverageBanner from "@/components/CoverageBanner";

function WizardContent() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type") as LocalBodyType | "unknown" | "other" | null;
  const districtParam = searchParams.get("district");
  const placeParam = searchParams.get("place");
  const pincodeParam = searchParams.get("pincode");
  const issueParam = searchParams.get("issue") as IssueSlug | null;

  const [districts, setDistricts] = useState<DistrictIndexEntry[]>([]);
  const [pincodesMap, setPincodesMap] = useState<PincodeMap>({});
  const pincodesLoadedRef = useRef(false);
  const [stateInfo, setStateInfo] = useState<StateData | null>(null);
  const [recheckIds, setRecheckIds] = useState<Set<string>>(new Set());

  const [currentDistrictData, setCurrentDistrictData] = useState<DistrictData | null>(null);
  const [currentPlaces, setCurrentPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const [selectedType, setSelectedType] = useState<LocalBodyType | "unknown" | "other" | null>(
    typeParam
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(districtParam);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(placeParam);
  const [selectedIssue, setSelectedIssue] = useState<IssueSlug | null>(issueParam);
  const [activeIssueData, setActiveIssueData] = useState<Issue | null>(null);
  const [pincodeInput, setPincodeInput] = useState(pincodeParam || "");

  const [placeFilter, setPlaceFilter] = useState<"all" | "village" | "block" | "ward">("all");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>("all");
  const [pinScope, setPinScope] = useState<"pin" | "all">("pin");
  const [copied1076, setCopied1076] = useState(false);
  const [savedArea, setSavedArea] = useState<SavedArea | null>(null);
  const [savedNoticeDismissed, setSavedNoticeDismissed] = useState(false);
  const [needsDistrictHint, setNeedsDistrictHint] = useState(false);

  const districtSectionRef = useRef<HTMLDivElement>(null);
  const lastAutoAppliedPinRef = useRef<string | null>(null);
  const pinEditedRef = useRef(false);

  const ensurePincodesLoaded = useCallback(() => {
    if (pincodesLoadedRef.current) return;
    pincodesLoadedRef.current = true;
    loadPincodes().then(setPincodesMap);
  }, []);

  const pinState = usePincodeLookup(pincodeInput, pincodesMap);

  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    loadStateData().then(setStateInfo);
    loadRecheckOffices().then(setRecheckIds);
    setSavedArea(readSavedArea());
  }, []);

  // Sync URL params cleanly
  useEffect(() => {
    setSelectedType(typeParam);
    if (districtParam) {
      setSelectedDistrict(districtParam);
    } else if (!pincodeParam) {
      setSelectedDistrict(null);
    }
    setSelectedPlace(placeParam);
    setSelectedIssue(issueParam);
  }, [typeParam, districtParam, placeParam, pincodeParam, issueParam]);

  useEffect(() => {
    if (!pincodeParam) return;
    const clean = pincodeParam.replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6) {
      setPincodeInput(clean);
      ensurePincodesLoaded();
    }
  }, [pincodeParam, ensurePincodesLoaded]);

  // Load selected issue metadata when chosen (for rich 1076 summary)
  useEffect(() => {
    if (!selectedIssue) {
      setActiveIssueData(null);
      return;
    }
    loadIssue(selectedIssue).then(setActiveIssueData);
  }, [selectedIssue]);

  // Auto-detect single-match district per PIN once (and update cleanly if user edited PIN to a different district)
  useEffect(() => {
    if (pincodeInput.length !== 6) {
      lastAutoAppliedPinRef.current = null;
      return;
    }
    if (pinState.matches.length === 1 && lastAutoAppliedPinRef.current !== pincodeInput) {
      const matched = pinState.matches[0].district_id;
      lastAutoAppliedPinRef.current = pincodeInput;
      const shouldUpdate = !districtParam || (pinEditedRef.current && selectedDistrict !== matched);
      if (shouldUpdate) {
        pinEditedRef.current = false;
        setSelectedDistrict(matched);
        setSelectedPlace(null);
        setSelectedBlockFilter("all");
        setPinScope("pin");
        if (districtParam && districtParam !== matched) {
          const params = new URLSearchParams();
          if (selectedType) params.set("type", selectedType);
          params.set("district", matched);
          params.set("pincode", pincodeInput);
          if (selectedIssue) params.set("issue", selectedIssue);
          router.replace(`/find/?${params.toString()}`);
        }
      }
    } else if (
      pinEditedRef.current &&
      pinState.matches.length > 1 &&
      selectedDistrict &&
      !pinState.matches.some((m) => m.district_id === selectedDistrict)
    ) {
      pinEditedRef.current = false;
      setSelectedDistrict(null);
      setSelectedPlace(null);
    }
  }, [pincodeInput, pinState.matches, districtParam, selectedDistrict, selectedType, selectedIssue, router]);

  useEffect(() => {
    if (selectedDistrict) {
      setLoadingPlaces(true);
      setNeedsDistrictHint(false);
      Promise.all([
        loadDistrictData(selectedDistrict),
        loadPlacesData(selectedDistrict),
      ]).then(([dData, pList]) => {
        setCurrentDistrictData(dData);
        setCurrentPlaces(pList);
        setLoadingPlaces(false);
      });
    } else {
      setCurrentDistrictData(null);
      setCurrentPlaces([]);
    }
  }, [selectedDistrict]);

  // Reset block filter cleanly when changing district
  useEffect(() => {
    setSelectedBlockFilter("all");
    setPinScope("pin");
  }, [selectedDistrict]);

  const updateUrl = (
    newType: string | null,
    newDistrict: string | null,
    newPlace: string | null,
    newPin?: string | null,
    newIssue?: IssueSlug | null
  ) => {
    const params = new URLSearchParams();
    if (newType) params.set("type", newType);
    if (newDistrict) params.set("district", newDistrict);
    if (newPlace) params.set("place", newPlace);
    const pin = newPin !== undefined ? newPin : pincodeInput;
    if (pin && pin.length === 6) params.set("pincode", pin);
    const iss = newIssue !== undefined ? newIssue : selectedIssue;
    if (iss) params.set("issue", iss);
    const qs = params.toString();
    router.replace(qs ? `/find/?${qs}` : `/find/`);
  };

  // True 3-Step Sequence:
  // Step 1: Location + Area Type (PIN / District + Village vs Town vs Not sure)
  // Step 2: Pinpoint Village, Block, or Town
  // Step 3: Your Officers & Action Plan
  let step = 1;
  if (selectedType && selectedDistrict) {
    step = selectedPlace ? 3 : 2;
  }

  const getDistrictName = useCallback(
    (id: string) => {
      const dEntry = districts.find((d) => d.id === id);
      return dEntry ? getLocalized(dEntry, "name", lang) : id;
    },
    [districts, lang]
  );

  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, "").slice(0, 6);
    pinEditedRef.current = true;
    setPincodeInput(cleanPin);
    if (cleanPin.length >= 1) {
      ensurePincodesLoaded();
    }
    if (cleanPin.length < 6) {
      lastAutoAppliedPinRef.current = null;
    }
  };

  const handleClearPincode = () => {
    lastAutoAppliedPinRef.current = null;
    pinEditedRef.current = false;
    setPincodeInput("");
    setSelectedDistrict(null);
    setSelectedPlace(null);
    setSelectedBlockFilter("all");
    updateUrl(selectedType, null, null, null);
  };

  const districtOptions: SearchOption[] = useMemo(() => {
    return districts.map((d) => ({
      id: d.id,
      label: getLocalized(d, "name", lang),
      sublabel: `${t("directory.division", { division: getLocalized(d, "division", lang) })}`,
      searchValue: `${d.name_en} ${d.name_hi}`,
    }));
  }, [districts, lang, t]);

  // First narrow places to the chosen area type, then filter by active 6-digit PIN
  const areaScopedPlaces = useMemo(() => {
    if (!currentPlaces.length) return [];
    if (selectedType === "gram_panchayat") {
      return currentPlaces.filter((p) => p.type === "village" || p.local_body_type === "gram_panchayat");
    }
    if (selectedType === "nagar_panchayat" || selectedType === "nagar_palika_parishad") {
      const towns = currentPlaces.filter(
        (p) =>
          p.type === "ward" &&
          p.local_body_type !== "nagar_nigam" &&
          p.local_body_type !== "authority_area" &&
          p.local_body_type !== "cantonment_board"
      );
      return towns.length > 0
        ? towns
        : currentPlaces.filter((p) => p.type === "ward" && p.local_body_type !== "nagar_nigam");
    }
    if (selectedType === "nagar_nigam") {
      const nigams = currentPlaces.filter((p) => p.local_body_type === "nagar_nigam");
      return nigams.length > 0 ? nigams : currentPlaces.filter((p) => p.type === "ward");
    }
    if (selectedType === "other") {
      const specials = currentPlaces.filter(
        (p) => p.local_body_type === "authority_area" || p.local_body_type === "cantonment_board"
      );
      return specials.length > 0 ? specials : currentPlaces.filter((p) => p.type === "ward");
    }
    return currentPlaces;
  }, [currentPlaces, selectedType]);

  // Places matching active 6-digit PIN inside areaScopedPlaces
  const pinMatchedPlaces = useMemo(() => {
    if (pincodeInput.length !== 6 || areaScopedPlaces.length === 0) return [];
    return areaScopedPlaces.filter((p) => p.pincodes?.includes(pincodeInput));
  }, [areaScopedPlaces, pincodeInput]);

  // Base pool of places narrowed by Step 1 area type & optional PIN filter
  const baseScopedPlaces = useMemo(() => {
    if (!areaScopedPlaces.length) return [];
    return pinMatchedPlaces.length > 0 && pinScope === "pin" ? pinMatchedPlaces : areaScopedPlaces;
  }, [areaScopedPlaces, pinMatchedPlaces, pinScope]);

  // Unique blocks for optional Block (Vikas Khand) narrowing
  const uniqueBlocks = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of baseScopedPlaces) {
      if (!p.block_id) continue;
      if (!map.has(p.block_id)) {
        map.set(p.block_id, getPlaceBlockLabel(p, currentDistrictData, lang) || p.block_id);
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [baseScopedPlaces, currentDistrictData, lang]);

  const placeOptions: SearchOption[] = useMemo(() => {
    if (!baseScopedPlaces.length) return [];
    const filteredPlaces = baseScopedPlaces.filter((p) => {
      if (selectedBlockFilter !== "all" && p.block_id !== selectedBlockFilter) {
        return false;
      }
      if (placeFilter === "block") return p.id.startsWith("block-");
      if (placeFilter === "village") return p.type === "village" && !p.id.startsWith("block-");
      if (placeFilter === "ward") return p.type === "ward";
      return true;
    });

    const list =
      filteredPlaces.length > 0
        ? filteredPlaces
        : selectedBlockFilter === "all" && placeFilter === "all"
        ? areaScopedPlaces
        : filteredPlaces;

    return list.map((p) => ({
      id: p.id,
      label: getLocalized(p, "name", lang),
      sublabel: formatPlaceSublabel(p, lang),
      searchValue: `${p.name_en} ${p.name_hi} ${p.block_name_en || ""} ${p.block_name_hi || ""} ${p.tehsil_name_en || ""} ${p.block_id || ""} ${p.gp_id || ""} ${p.pincodes?.join(" ") || ""}`,
    }));
  }, [baseScopedPlaces, areaScopedPlaces, selectedBlockFilter, placeFilter, lang]);

  const resolution: ResolutionResult | null = useMemo(() => {
    if (step !== 3 || !selectedDistrict || !currentDistrictData) return null;
    return resolveOfficers(
      selectedType || "unknown",
      selectedDistrict,
      selectedPlace === "district-hq" ? null : selectedPlace,
      currentDistrictData,
      currentPlaces,
      stateInfo || undefined,
      recheckIds
    );
  }, [step, selectedType, selectedDistrict, selectedPlace, currentDistrictData, currentPlaces, stateInfo, recheckIds]);

  const activeIssueSlug: IssueSlug = selectedIssue || "street-light";
  const primaryIssueOfficer = useMemo(() => {
    if (!resolution) return null;
    if (!selectedIssue) return resolution.officers[0] || null;
    return getPrimaryOfficerForIssue(selectedIssue, resolution);
  }, [resolution, selectedIssue]);

  const issuePortals = useMemo(() => {
    const effLocalType = resolution?.place?.local_body_type || selectedType || "unknown";
    return getRelevantPortals(activeIssueSlug, effLocalType, stateInfo);
  }, [activeIssueSlug, resolution, selectedType, stateInfo]);

  // Persist active chosen area cleanly to browser localStorage on Step 3
  useEffect(() => {
    if (step !== 3 || !selectedDistrict || !selectedPlace) return;
    const distMeta = districts.find((d) => d.id === selectedDistrict);
    const placeObj = resolution?.place;
    const effType = placeObj?.local_body_type || selectedType || "unknown";
    const saved = saveArea({
      districtId: selectedDistrict,
      districtNameEn: distMeta?.name_en || selectedDistrict,
      districtNameHi: distMeta?.name_hi || distMeta?.name_en || selectedDistrict,
      placeId: selectedPlace,
      placeNameEn: placeObj?.name_en || (selectedPlace === "district-hq" ? "District HQ" : selectedPlace),
      placeNameHi: placeObj?.name_hi || (selectedPlace === "district-hq" ? "जनपद मुख्यालय" : selectedPlace),
      localBodyType: effType,
      pincode: pincodeInput.length === 6 ? pincodeInput : placeObj?.pincodes?.[0],
    });
    setSavedArea(saved);
    setSavedNoticeDismissed(false);
  }, [step, selectedDistrict, selectedPlace, selectedType, resolution?.place, districts, pincodeInput]);

  const handleBack = () => {
    if (step === 3) {
      setSelectedPlace(null);
      updateUrl(selectedType, selectedDistrict, null);
    } else if (step === 2) {
      setSelectedType(null);
      setSelectedPlace(null);
      updateUrl(null, selectedDistrict, null);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === 1) {
      setSelectedType(null);
      setSelectedPlace(null);
      updateUrl(null, selectedDistrict, null);
    } else if (targetStep === 2 && selectedDistrict) {
      setSelectedPlace(null);
      updateUrl(selectedType || "unknown", selectedDistrict, null);
    }
  };

  const handleSelectAreaType = (areaType: LocalBodyType | "unknown" | "other") => {
    setSelectedType(areaType);
    let effDistrict = selectedDistrict;
    if (!effDistrict && pinState.matches.length === 1) {
      effDistrict = pinState.matches[0].district_id;
      setSelectedDistrict(effDistrict);
    } else if (!effDistrict && pincodeInput.length === 6) {
      const res = resolvePincode(pincodeInput, pincodesMap);
      if (res.matches.length === 1) {
        effDistrict = res.matches[0].district_id;
        setSelectedDistrict(effDistrict);
      }
    }

    if (areaType === "gram_panchayat") {
      setPlaceFilter("all");
    } else if (areaType === "nagar_panchayat" || areaType === "nagar_palika_parishad" || areaType === "nagar_nigam") {
      setPlaceFilter("all");
    } else {
      setPlaceFilter("all");
    }

    if (!effDistrict) {
      setNeedsDistrictHint(true);
      updateUrl(areaType, null, null);
      districtSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setNeedsDistrictHint(false);
    updateUrl(areaType, effDistrict, selectedPlace);
  };

  const handleCopy1076Summary = async () => {
    const distMeta = districts.find((d) => d.id === selectedDistrict) || null;
    const summaryText = build1076ComplaintSummary({
      lang,
      district: distMeta,
      districtData: currentDistrictData,
      place: resolution?.place || null,
      issue: activeIssueData,
      primaryOfficer: primaryIssueOfficer,
      pincode: pincodeInput,
    });
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied1076(true);
      setTimeout(() => setCopied1076(false), 2500);
    } catch {}
  };

  const pinQuerySuffix = pincodeInput.length === 6 ? `&pincode=${encodeURIComponent(pincodeInput)}` : "";
  const effectivePlaceParam = selectedPlace === "district-hq" ? "" : selectedPlace || "";

  return (
    <div className="max-w-form mx-auto">
      <Stepper
        currentStep={step}
        totalSteps={3}
        canBack={step > 1}
        onBack={handleBack}
        onStepClick={handleStepClick}
      />

      {/* Active Issue Context Banner */}
      {selectedIssue && step < 3 && (
        <div className="mb-4 p-3 rounded-[4px] bg-[#FFF5F0] border border-[#C84B16]/30 flex flex-wrap items-center justify-between gap-2 text-[14px]">
          <span className="font-semibold text-[#C84B16]">
            {t("find.activeIssueLabel")}: {t(`issue.${selectedIssue}`)}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedIssue(null);
              updateUrl(selectedType, selectedDistrict, selectedPlace, undefined, null);
            }}
            className="text-[13px] font-semibold text-muted underline hover:text-text"
          >
            {t("flow.pincodeClear")}
          </button>
        </div>
      )}

      {/* STEP 1: Location-First Entry (PIN + District + Plain-Language Area Type) */}
      {step === 1 && (
        <section aria-labelledby="q1-heading" className="space-y-6">
          <div className="space-y-2">
            <h1 id="q1-heading" className="page-title text-text">
              {t("find.step1Headline")}
            </h1>
            <p className="text-[16px] text-muted leading-relaxed max-w-[60ch]">
              {t("find.step1Sub")}
            </p>
          </div>

          {/* Location Panel: Side-by-Side 6-digit PIN + District SearchSelect */}
          <div ref={districtSectionRef} className="p-5 sm:p-6 rounded-[12px] bg-surface border border-border shadow-[0_1px_3px_rgba(22,27,34,0.05)] overflow-visible relative z-30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-5 space-y-1.5">
                <label htmlFor="wizard-pincode-input" className="block text-[12px] font-bold uppercase tracking-[0.06em] text-muted">
                  {t("flow.quickPincode")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="wizard-pincode-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    enterKeyHint="next"
                    maxLength={6}
                    value={pincodeInput}
                    onFocus={ensurePincodesLoaded}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="226001"
                    className="w-full min-h-[46px] px-3.5 py-2 bg-[#FAF9F6] focus:bg-surface text-text text-[16px] font-medium tabular-nums border border-[#A8A295] rounded-[8px] shadow-[0_1px_2px_rgba(22,27,34,0.03)] focus:border-[#154273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154273]/25 transition-colors"
                  />
                  {pincodeInput && (
                    <button
                      type="button"
                      onClick={handleClearPincode}
                      aria-label={t("flow.pincodeClear")}
                      className="min-h-[46px] min-w-[40px] rounded-[8px] border border-border bg-[#FAF9F6] text-muted hover:text-danger hover:border-danger/40 inline-flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-[12.5px] text-muted">
                    {t("flow.pincodePlaceholder")}
                  </span>
                  {pinState.matches.length === 1 && selectedDistrict && (
                    <Badge
                      variant="success"
                      label={getDistrictName(selectedDistrict)}
                    />
                  )}
                </div>
              </div>

              <div className="md:col-span-7">
                <SearchSelect
                  label={t("flow.selectDistrict")}
                  options={districtOptions}
                  value={selectedDistrict}
                  onSelect={(opt) => {
                    const nextDist = opt.id;
                    const matchesCurrentPin = pinState.matches.some((m) => m.district_id === nextDist);
                    const nextPin = pincodeInput && !matchesCurrentPin ? "" : pincodeInput;
                    if (pincodeInput && !matchesCurrentPin) {
                      lastAutoAppliedPinRef.current = null;
                      setPincodeInput("");
                    }
                    setSelectedDistrict(nextDist);
                    setSelectedPlace(null);
                    setNeedsDistrictHint(false);
                    updateUrl(selectedType, nextDist, null, nextPin || null);
                  }}
                />
              </div>
            </div>

            {pinState.matches.length > 1 && (
              <Banner
                status="info"
                container="card"
                collapsible={false}
                title={t("flow.pincodeMulti")}
                description={
                  pinState.localitySummary
                    ? t("flow.pincodeAreaHint", { area: pinState.localitySummary })
                    : undefined
                }
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {pinState.matches.map((m) => (
                    <Button
                      key={m.district_id}
                      type="button"
                      size="sm"
                      variant={selectedDistrict === m.district_id ? "primary" : "secondary"}
                      label={getDistrictName(m.district_id)}
                      onClick={() => {
                        setSelectedDistrict(m.district_id);
                        setSelectedPlace(null);
                        updateUrl(selectedType, m.district_id, null, pincodeInput);
                      }}
                    />
                  ))}
                </div>
              </Banner>
            )}

            {pinState.kind === "out_of_state" && pinState.outOfStateInfo && (
              <Banner
                status="warning"
                container="card"
                title={t("flow.pincodeOutOfState", {
                  pin: pincodeInput,
                  district: pinState.outOfStateInfo.district,
                  state: pinState.outOfStateInfo.state,
                })}
              />
            )}

            {pinState.kind === "not_found" && (
              <Banner
                status={pinState.isCheckingLive ? "info" : "warning"}
                container="card"
                title={
                  pinState.isCheckingLive
                    ? t("flow.pincodeCheckingLive")
                    : t("flow.pincodeNotFound")
                }
              />
            )}

            {needsDistrictHint && !selectedDistrict && (
              <Banner
                status="warning"
                container="card"
                title={t("find.pickDistrictPrompt")}
              />
            )}

            {selectedDistrict && (
              <div className="p-3 rounded-[8px] bg-[#EBF1F6] border border-[#C6D4E2] flex flex-wrap items-center justify-between gap-2 text-[14px]">
                <span className="font-semibold text-[#154273]">
                  ✓ {t("flow.pincodeSelectedBar", { district: getDistrictName(selectedDistrict) })}
                  {pincodeInput.length === 6 && ` (PIN ${pincodeInput})`}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAreaType(selectedType || "unknown")}
                  className="text-[14px] font-semibold text-[#C84B16] underline underline-offset-4 hover:text-[#AD3E0F]"
                >
                  {t("find.continueToPlace")} →
                </button>
              </div>
            )}
          </div>

          {/* Plain-Language Area Type Options with Visual Icons */}
          <div className="space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-muted">
              {t("find.areaTypeOptionalLabel")}
            </p>
            <div className="space-y-2.5">
              <ChoiceButton
                title={t("find.areaVillageTitle")}
                subtitle={t("find.areaVillageSub")}
                selected={selectedType === "gram_panchayat"}
                onClick={() => handleSelectAreaType("gram_panchayat")}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M3 10.5L12 3l9 7.5" />
                    <path d="M5 10v10h14V10" />
                    <path d="M9 20v-6h6v6" />
                  </svg>
                }
              />
              <ChoiceButton
                title={t("find.areaTownTitle")}
                subtitle={t("find.areaTownSub")}
                selected={selectedType === "nagar_panchayat" || selectedType === "nagar_palika_parishad"}
                onClick={() => handleSelectAreaType("nagar_palika_parishad")}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <rect x="3" y="8" width="18" height="13" rx="1" />
                    <path d="M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3" />
                    <line x1="8" y1="13" x2="8" y2="17" />
                    <line x1="12" y1="13" x2="12" y2="17" />
                    <line x1="16" y1="13" x2="16" y2="17" />
                  </svg>
                }
              />
              <ChoiceButton
                title={t("find.areaNigamTitle")}
                subtitle={t("find.areaNigamSub")}
                selected={selectedType === "nagar_nigam"}
                onClick={() => handleSelectAreaType("nagar_nigam")}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <rect x="3" y="4" width="8" height="17" rx="1" />
                    <rect x="13" y="9" width="8" height="12" rx="1" />
                    <line x1="6" y1="8" x2="8" y2="8" />
                    <line x1="6" y1="12" x2="8" y2="12" />
                    <line x1="16" y1="13" x2="18" y2="13" />
                    <line x1="16" y1="17" x2="18" y2="17" />
                  </svg>
                }
              />
              <ChoiceButton
                title={t("find.areaOtherTitle")}
                subtitle={t("find.areaOtherSub")}
                selected={selectedType === "other"}
                onClick={() => handleSelectAreaType("other")}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                }
              />
              <ChoiceButton
                title={t("find.areaUnsureTitle")}
                subtitle={t("find.areaUnsureSub")}
                selected={selectedType === "unknown"}
                onClick={() => handleSelectAreaType("unknown")}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <circle cx="12" cy="12" r="9" />
                    <polygon points="15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5 15.5 8.5" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Optional Issue Quick Pills */}
          <div className="p-4 rounded-[12px] bg-[#FAF9F6] border border-border space-y-2.5">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">
              {t("find.optionalIssueTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {ISSUE_LIST.map((item) => {
                const active = selectedIssue === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      const next = active ? null : item.slug;
                      setSelectedIssue(next);
                      updateUrl(selectedType, selectedDistrict, selectedPlace, undefined, next);
                    }}
                    className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium border transition-colors ${
                      active
                        ? "bg-[#C84B16] text-white border-[#C84B16] shadow-sm"
                        : "bg-surface text-text border-border hover:border-[#154273]"
                    }`}
                  >
                    {t(item.titleKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* STEP 2: Pinpoint Village, Block, or Town */}
      {step === 2 && selectedDistrict && (
        <section aria-labelledby="q2-place-heading" className="space-y-5">
          <div className="p-3.5 rounded-[10px] bg-[#EBF1F6] border border-[#C6D4E2] flex flex-wrap items-center justify-between gap-2 text-[14px]">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#154273] block">
                ✓ {t("flow.pincodeSelectedBar", { district: getDistrictName(selectedDistrict) })}
                {pincodeInput.length === 6 && ` (PIN ${pincodeInput})`}
              </span>
              {pinState.localitySummary && (
                <span className="text-[12.5px] text-muted block">
                  {t("flow.pincodeAreaHint", { area: pinState.localitySummary })}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDistrict(null);
                setSelectedPlace(null);
                updateUrl(selectedType, null, null);
              }}
              className="text-[13px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
            >
              {t("flow.changeDistrict")}
            </button>
          </div>

          <h1 id="q2-place-heading" className="page-title text-text">
            {selectedType === "gram_panchayat"
              ? t("flow.q3.village")
              : selectedType === "nagar_panchayat" || selectedType === "nagar_palika_parishad" || selectedType === "nagar_nigam" || selectedType === "other"
              ? t("flow.q3.ward")
              : t("issue.selectPlaceLabel")}
          </h1>

          {loadingPlaces ? (
            <div className="py-8 text-center text-muted font-medium">
              {t("common.loading")}
            </div>
          ) : currentPlaces.length === 0 ? (
            <Banner
              status="info"
              container="card"
              collapsible={false}
              title={t("flow.noPlacesNotice", {
                district: getDistrictName(selectedDistrict),
              })}
            >
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  label={`${t("flow.viewDistrictOfficers")} →`}
                  onClick={() => {
                    setSelectedPlace("district-hq");
                    updateUrl(selectedType, selectedDistrict, "district-hq");
                  }}
                />
              </div>
            </Banner>
          ) : (
            <div className="space-y-4">
              {pinMatchedPlaces.length > 0 && (
                <div className="p-3.5 rounded-[10px] bg-surface border border-border flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-[13px] font-semibold text-text">
                    {t("find.pinMatchesSummary", {
                      pin: pincodeInput,
                      count: pinMatchedPlaces.length,
                    })}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPinScope("pin")}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] border transition-colors ${
                        pinScope === "pin"
                          ? "bg-[#154273] text-white border-[#154273]"
                          : "bg-[#FAF9F6] text-muted border-border hover:border-[#154273]"
                      }`}
                    >
                      {t("find.pinFilteredPlacesToggle", {
                        pin: pincodeInput,
                        count: pinMatchedPlaces.length,
                      })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinScope("all")}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] border transition-colors ${
                        pinScope === "all"
                          ? "bg-[#154273] text-white border-[#154273]"
                          : "bg-[#FAF9F6] text-muted border-border hover:border-[#154273]"
                      }`}
                    >
                      {t("find.allPlacesToggle", {
                        district: getDistrictName(selectedDistrict),
                        count: areaScopedPlaces.length,
                      })}
                    </button>
                  </div>
                </div>
              )}

              {uniqueBlocks.length > 1 && placeFilter !== "ward" && (
                <div>
                  <label
                    htmlFor="find-block-filter"
                    className="block text-[12px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5"
                  >
                    {t("find.blockFilterLabel")}
                  </label>
                  <select
                    id="find-block-filter"
                    value={selectedBlockFilter}
                    onChange={(e) => setSelectedBlockFilter(e.target.value)}
                    className="civic-select w-full min-h-[46px] px-3.5 py-2 bg-surface text-text text-[15px] border border-[#A8A295] rounded-[8px] focus:border-[#154273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154273]/25 transition-colors"
                  >
                    <option value="all">
                      {t("find.allBlocksOption", { count: uniqueBlocks.length })}
                    </option>
                    {uniqueBlocks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedType === "unknown" || selectedType === "gram_panchayat") && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">
                    {t("issue.filterAreaType")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedType === "gram_panchayat"
                      ? ([
                          { id: "all", key: "flow.filterAll" },
                          { id: "village", key: "flow.filterVillage" },
                          { id: "block", key: "flow.filterBlock" },
                        ] as const)
                      : ([
                          { id: "all", key: "flow.filterAll" },
                          { id: "village", key: "flow.filterVillage" },
                          { id: "block", key: "flow.filterBlock" },
                          { id: "ward", key: "flow.filterTown" },
                        ] as const)
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setPlaceFilter(f.id)}
                        className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] border transition-colors ${
                          placeFilter === f.id
                            ? "bg-[#154273] text-white border-[#154273]"
                            : "bg-surface text-muted border-border hover:border-[#154273]"
                        }`}
                      >
                        {t(f.key)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <SearchSelect
                label={
                  placeFilter === "block"
                    ? t("flow.filterBlock")
                    : selectedType === "gram_panchayat"
                    ? t("flow.q3.village")
                    : selectedType === "unknown"
                    ? t("issue.selectPlaceLabel")
                    : t("flow.q3.ward")
                }
                options={placeOptions}
                value={selectedPlace}
                onSelect={(opt) => {
                  setSelectedPlace(opt.id);
                  updateUrl(selectedType, selectedDistrict, opt.id);
                }}
              />

              <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3">
                {(selectedType === "gram_panchayat" || selectedType === "unknown") && (
                  <button
                    type="button"
                    onClick={() => setPlaceFilter("block")}
                    className="text-[14px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                  >
                    {t("flow.pickBlockFallback")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlace("district-hq");
                    updateUrl(selectedType, selectedDistrict, "district-hq");
                  }}
                  className="text-[13px] font-medium text-muted underline underline-offset-4 hover:text-text"
                >
                  {t("flow.skipPlace")} →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* STEP 3: Results "Your officers" + Action Plan */}
      {step === 3 && resolution && (
        <section aria-labelledby="results-heading" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 id="results-heading" className="page-title text-text">
              {t("results.title")}
            </h1>
            <Badge
              variant="success"
              label={
                resolution.place
                  ? getLocalized(resolution.place, "name", lang)
                  : selectedDistrict
                  ? getDistrictName(selectedDistrict)
                  : ""
              }
            />
          </div>

          {resolution.place ? (
            <div className="p-4 rounded-[12px] bg-surface border border-border border-l-[4px] border-l-[#154273] shadow-[0_1px_2px_rgba(22,27,34,0.03)] flex flex-wrap items-center justify-between gap-2 text-[15px] text-text font-medium">
              <div>
                <span className="block font-semibold">
                  {getLocalized(resolution.place, "name", lang)}
                  {selectedDistrict && ` · ${getDistrictName(selectedDistrict)}`}
                </span>
                {formatPlaceBlockAndTehsil(resolution.place, currentDistrictData, lang) && (
                  <span className="block text-[13px] text-muted mt-0.5">
                    {formatPlaceBlockAndTehsil(resolution.place, currentDistrictData, lang)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStepClick(2)}
                  className="text-[13px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                >
                  {t("flow.change")}
                </button>
                {savedArea && !savedNoticeDismissed && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSavedArea();
                      setSavedNoticeDismissed(true);
                    }}
                    className="text-[12px] text-muted hover:text-danger underline underline-offset-4"
                  >
                    {t("saved.clear")}
                  </button>
                )}
              </div>
            </div>
          ) : selectedDistrict ? (
            <div className="p-4 rounded-[12px] bg-surface border border-border border-l-[4px] border-l-[#154273] shadow-[0_1px_2px_rgba(22,27,34,0.03)] flex flex-wrap items-center justify-between gap-2 text-[15px] text-text font-medium">
              <span>{getDistrictName(selectedDistrict)}</span>
              <button
                type="button"
                onClick={() => handleStepClick(2)}
                className="text-[13px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
              >
                {t("flow.change")}
              </button>
            </div>
          ) : null}

          {resolution.secretaryNotIndexed && (
            <Banner
              status="info"
              container="card"
              title={t("results.secretaryDirectoryTitle")}
              description={t("results.secretaryDirectoryNote")}
            />
          )}

          {resolution.hasCoverageGap && <CoverageBanner />}

          {resolution.isCantonmentOrOther && (
            <Banner
              status="info"
              container="card"
              title={t("results.cantonmentTitle")}
              description={t("results.cantonmentDesc")}
            />
          )}

          {/* Civic Action Plan Box: Issue Picker + 1-Click 1076 Summary + Primary CTA */}
          <Card padding={5} variant="default" elevation="low">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C84B16]">
                    {t("find.actionPlanEyebrow")}
                  </p>
                  <h2 className="text-[19px] font-bold text-text tracking-[-0.015em]">
                    {t("find.pickProblemPrompt")}
                  </h2>
                </div>
                {selectedIssue && (
                  <Link
                    href={`/issue/${selectedIssue}/?district=${encodeURIComponent(
                      selectedDistrict || ""
                    )}&place=${encodeURIComponent(effectivePlaceParam)}${pinQuerySuffix}`}
                    className="px-3 py-1.5 rounded-[8px] bg-[#EBF1F6] hover:bg-[#DCE7F2] text-[13px] font-semibold text-[#154273] transition-colors whitespace-nowrap"
                  >
                    {t("find.viewFullLadder")} →
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {ISSUE_LIST.map((item) => {
                  const active = selectedIssue === item.slug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedIssue(item.slug);
                        updateUrl(selectedType, selectedDistrict, selectedPlace, undefined, item.slug);
                      }}
                      className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium border transition-colors ${
                        active
                          ? "bg-[#154273] text-white border-[#154273] shadow-sm"
                          : "bg-[#FAF9F6] text-text border-border hover:border-[#154273] hover:bg-surface"
                      }`}
                    >
                      {t(item.titleKey)}
                    </button>
                  );
                })}
              </div>

              {selectedIssue && primaryIssueOfficer && (
                <div className="p-4 rounded-[10px] bg-[#F2F6FA] border border-[#C6D4E2] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#C84B16] block">
                        1. {t("issue.doFirstTitle")} — {t(`issue.${selectedIssue}`)}
                      </span>
                      <span className="font-bold text-[17px] text-text block mt-0.5">
                        {getLocalized(primaryIssueOfficer.office, "office_name", lang)}
                      </span>
                    </div>
                    {primaryIssueOfficer.office.phones?.[0] && (
                      <CallButton number={primaryIssueOfficer.office.phones[0].number} />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[13px] pt-1 border-t border-[#D9E3EC]">
                    <Link
                      href={`/letter/?district=${encodeURIComponent(
                        selectedDistrict || ""
                      )}&place=${encodeURIComponent(
                        effectivePlaceParam
                      )}&issue=${encodeURIComponent(selectedIssue)}&officer=${encodeURIComponent(
                        getLocalized(primaryIssueOfficer.office, "office_name", lang)
                      )}${pinQuerySuffix}`}
                      className="px-3.5 py-2 rounded-[8px] bg-[#154273] text-white font-semibold hover:bg-[#0F3156] transition-colors"
                    >
                      2. {t("issue.writeComplaintBtn")} →
                    </Link>
                    <button
                      type="button"
                      onClick={handleCopy1076Summary}
                      className="px-3.5 py-2 rounded-[8px] border border-[#154273] bg-surface text-[#154273] font-semibold hover:bg-[#EBF1F6] transition-colors"
                    >
                      {copied1076 ? t("summary.copied1076") : t("summary.copy1076")}
                    </button>
                    {issuePortals.map((portal) => (
                      <a
                        key={portal.id}
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-[8px] border border-[#A8A295] bg-surface text-text font-medium hover:border-[#154273] transition-colors"
                      >
                        {lang === "hi" ? portal.name_hi : portal.name_en} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!selectedIssue && (
                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="text-muted">{t("summary.helplineTip")}</span>
                  <button
                    type="button"
                    onClick={handleCopy1076Summary}
                    className="px-3.5 py-1.5 rounded-[8px] border border-[#154273] bg-surface text-[#154273] font-semibold hover:bg-[#EBF1F6] transition-colors"
                  >
                    {copied1076 ? t("summary.copied1076") : t("summary.copy1076")}
                  </button>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-4" aria-live="polite">
            {resolution.officers.map((item) => (
              <OfficerCard key={`${item.office.id}-${item.resolvedRole}`} item={item} />
            ))}

            {/* State Escalation Panel */}
            <article className="p-6 bg-[#102E4F] text-white rounded-[12px] border-t-4 border-[#C84B16] shadow-[0_4px_12px_rgba(16,46,79,0.16)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#F39C72] mb-1.5">
                {t("results.stateOfficeTitle")}
              </p>
              <h3 className="font-bold text-[21px] text-white tracking-[-0.015em]">
                {t("helpline.bar")}
              </h3>
              <p className="text-[15px] text-[#DCE6F2] mt-1.5 mb-5 leading-relaxed">
                {t("results.stateOfficeDesc")}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`tel:${resolution.stateHelpline.number}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C84B16] hover:bg-[#AD3E0F] text-white font-semibold rounded-[8px] transition-colors tabular-nums"
                >
                  <span>{t("helpline.call")}</span>
                </a>
                <a
                  href={resolution.stateHelpline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-white/30 hover:bg-white/10 text-white font-medium rounded-[8px] transition-colors text-[15px]"
                >
                  <span>{t("results.jansunwaiLinkText")}</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopy1076Summary}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-medium rounded-[8px] transition-colors text-[14px]"
                >
                  {copied1076 ? t("summary.copied1076") : t("summary.copy1076")}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-3 text-[13px] text-[#DCE6F2]">
                <a
                  href="https://e-nagarsewaup.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline underline-offset-4 tabular-nums"
                >
                  {t("results.urbanHelpline")} ↗
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href="https://www.jalsamadhan.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline underline-offset-4 tabular-nums"
                >
                  {t("results.ruralWaterHelpline")} ↗
                </a>
              </div>
            </article>
          </div>

          <Divider />

          <div className="pt-2">
            <h3 className="font-bold text-[20px] text-text mb-4 tracking-[-0.015em]">
              {t("results.nextStepTitle")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href={`/issue/${encodeURIComponent(activeIssueSlug)}/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(effectivePlaceParam)}${pinQuerySuffix}`}
                className="min-h-[60px] p-4 rounded-[10px] border border-[#C6D4E2] bg-[#EBF1F6]/70 hover:bg-[#EBF1F6] text-[#154273] font-semibold text-center text-[14.5px] flex items-center justify-center civic-card-interactive"
              >
                {t("results.ladderBtn")}
              </Link>
              <Link
                href={`/letter/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(
                  effectivePlaceParam
                )}&issue=${encodeURIComponent(activeIssueSlug)}&officer=${encodeURIComponent(
                  primaryIssueOfficer
                    ? getLocalized(primaryIssueOfficer.office, "office_name", lang)
                    : resolution.officers[0]
                    ? getLocalized(resolution.officers[0].office, "office_name", lang)
                    : ""
                )}${pinQuerySuffix}`}
                className="min-h-[60px] p-4 rounded-[10px] border border-[#A8A295] bg-surface text-text font-semibold text-center text-[14.5px] flex items-center justify-center civic-card-interactive"
              >
                {t("results.letterBtn")}
              </Link>
              <Link
                href={`/rti/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(
                  effectivePlaceParam
                )}&issue=${encodeURIComponent(activeIssueSlug)}&officer=${encodeURIComponent(
                  primaryIssueOfficer
                    ? getLocalized(primaryIssueOfficer.office, "office_name", lang)
                    : resolution.officers[0]
                    ? getLocalized(resolution.officers[0].office, "office_name", lang)
                    : ""
                )}${pinQuerySuffix}`}
                className="min-h-[60px] p-4 rounded-[10px] border border-[#A8A295] bg-surface text-text font-semibold text-center text-[14.5px] flex items-center justify-center civic-card-interactive"
              >
                {t("results.rtiBtn")}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function FindPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted font-medium">Loading...</div>}>
      <WizardContent />
    </Suspense>
  );
}
