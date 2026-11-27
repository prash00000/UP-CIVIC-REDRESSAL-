"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import {
  Issue,
  DistrictData,
  DistrictIndexEntry,
  Place,
  PincodeMap,
  StateData,
} from "@/lib/types";
import {
  loadDistrictsIndex,
  loadDistrictData,
  loadPlacesData,
  loadPincodes,
  loadStateData,
  loadRecheckOffices,
} from "@/lib/data";
import { resolveOfficers } from "@/lib/resolver";
import { usePincodeLookup } from "@/lib/usePincodeLookup";
import {
  ISSUE_LIST,
  getIssueAreaSteps,
  getPrimaryOfficerForIssue,
  getRelevantPortals,
} from "@/lib/issue-routing";
import {
  formatPlaceBlockAndTehsil,
  formatPlaceSublabel,
  getPlaceBlockLabel,
} from "@/lib/place-display";
import { saveArea, readSavedArea } from "@/lib/saved-area";
import { build1076ComplaintSummary } from "@/lib/complaint-summary";
import SearchSelect, { SearchOption } from "@/components/SearchSelect";
import CallButton from "@/components/CallButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import LadderStep from "@/components/LadderStep";
import Checklist from "@/components/Checklist";

type PlaceFilterKind = "all" | "village" | "block" | "ward";

function IssueView({
  slug,
  initialIssue,
}: {
  slug: string;
  initialIssue: Issue | null;
}) {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const districtParam = searchParams.get("district") || "";
  const placeParam = searchParams.get("place") || "";
  const pincodeParam = searchParams.get("pincode") || "";

  const [issue, setIssue] = useState<Issue | null>(initialIssue);
  const [districts, setDistricts] = useState<DistrictIndexEntry[]>([]);
  const [pincodesMap, setPincodesMap] = useState<PincodeMap>({});
  const [stateData, setStateData] = useState<StateData | null>(null);
  const [recheckIds, setRecheckIds] = useState<Set<string>>(new Set());

  const [selectedDistrict, setSelectedDistrict] = useState<string>(districtParam);
  const [selectedPlace, setSelectedPlace] = useState<string>(placeParam);
  const [pinInput, setPinInput] = useState<string>(pincodeParam);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilterKind>("all");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>("all");
  const [pinScope, setPinScope] = useState<"pin" | "all">("pin");
  const [editingArea, setEditingArea] = useState<boolean>(!districtParam || !placeParam);
  const [copied1076, setCopied1076] = useState(false);

  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingArea, setLoadingArea] = useState<boolean>(false);

  const pincodesLoadedRef = useRef(false);
  const lastAutoAppliedPinRef = useRef<string | null>(null);
  const pinEditedRef = useRef(false);

  const ensurePincodesLoaded = useCallback(() => {
    if (pincodesLoadedRef.current) return;
    pincodesLoadedRef.current = true;
    loadPincodes().then(setPincodesMap);
  }, []);

  const pinState = usePincodeLookup(pinInput, pincodesMap);

  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    loadStateData().then(setStateData);
    loadRecheckOffices().then(setRecheckIds);
    if (pincodeParam && pincodeParam.replace(/\D/g, "").length >= 3) {
      ensurePincodesLoaded();
    }
    // Prefill saved area silently if no district/place/pincode query params exist
    if (!districtParam && !placeParam && !pincodeParam) {
      const saved = readSavedArea();
      if (saved) {
        setSelectedDistrict(saved.districtId);
        setSelectedPlace(saved.placeId);
        if (saved.pincode) {
          setPinInput(saved.pincode);
          ensurePincodesLoaded();
        }
        setEditingArea(false);
      }
    }
  }, [districtParam, placeParam, pincodeParam, ensurePincodesLoaded]);

  useEffect(() => {
    if (!initialIssue) {
      fetch(`/data/issues/${slug}.json`)
        .then((r) => r.json())
        .then(setIssue)
        .catch(console.error);
    }
  }, [slug, initialIssue]);

  useEffect(() => {
    if (districtParam || placeParam || pincodeParam) {
      setSelectedDistrict(districtParam);
      setSelectedPlace(placeParam);
      if (pincodeParam) {
        setPinInput(pincodeParam);
        ensurePincodesLoaded();
      }
      if (!districtParam || !placeParam) {
        setEditingArea(true);
      }
    }
  }, [districtParam, placeParam, pincodeParam, ensurePincodesLoaded]);

  useEffect(() => {
    setSelectedBlockFilter("all");
    setPinScope("pin");
    if (selectedDistrict) {
      setLoadingArea(true);
      Promise.all([
        loadDistrictData(selectedDistrict),
        loadPlacesData(selectedDistrict),
      ]).then(([d, p]) => {
        setDistrictData(d);
        setPlaces(p);
        setLoadingArea(false);
      });
    } else {
      setDistrictData(null);
      setPlaces([]);
    }
  }, [selectedDistrict]);

  const syncUrl = useCallback(
    (nextDist: string, nextPlace: string, nextPin: string) => {
      const params = new URLSearchParams();
      if (nextDist) params.set("district", nextDist);
      if (nextPlace) params.set("place", nextPlace);
      if (nextPin && nextPin.length === 6) params.set("pincode", nextPin);
      const qs = params.toString();
      router.replace(qs ? `/issue/${slug}/?${qs}` : `/issue/${slug}/`);
    },
    [router, slug]
  );

  // Auto-select district from single-match 6-digit PIN once per PIN entry (and update when edited)
  useEffect(() => {
    if (pinInput.length !== 6) {
      lastAutoAppliedPinRef.current = null;
      return;
    }
    if (pinState.matches.length === 1 && lastAutoAppliedPinRef.current !== pinInput) {
      lastAutoAppliedPinRef.current = pinInput;
      const matchedDist = pinState.matches[0].district_id;
      if (!selectedDistrict || (pinEditedRef.current && selectedDistrict !== matchedDist)) {
        pinEditedRef.current = false;
        setSelectedDistrict(matchedDist);
        setSelectedPlace("");
        syncUrl(matchedDist, "", pinInput);
      }
    } else if (
      pinEditedRef.current &&
      pinState.matches.length > 1 &&
      selectedDistrict &&
      !pinState.matches.some((m) => m.district_id === selectedDistrict)
    ) {
      pinEditedRef.current = false;
      setSelectedDistrict("");
      setSelectedPlace("");
      syncUrl("", "", pinInput);
    }
  }, [pinInput, pinState.matches, selectedDistrict, syncUrl]);

  const getDistrictName = (id: string) => {
    const found = districts.find((d) => d.id === id);
    return found ? getLocalized(found, "name", lang) : id;
  };

  const districtOptions: SearchOption[] = useMemo(
    () =>
      districts.map((d) => ({
        id: d.id,
        label: getLocalized(d, "name", lang),
        sublabel: t("directory.division", { division: getLocalized(d, "division", lang) }),
        searchValue: `${d.name_en} ${d.name_hi}`,
      })),
    [districts, lang, t]
  );

  const pinMatchedPlaces = useMemo(() => {
    if (pinInput.length !== 6 || places.length === 0) return [];
    return places.filter((p) => p.pincodes?.includes(pinInput));
  }, [places, pinInput]);

  const basePlaces = useMemo(() => {
    if (pinMatchedPlaces.length > 0 && pinScope === "pin") {
      return pinMatchedPlaces;
    }
    return places;
  }, [places, pinMatchedPlaces, pinScope]);

  const uniqueBlocks = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of basePlaces) {
      if (!p.block_id) continue;
      if (!map.has(p.block_id)) {
        map.set(p.block_id, getPlaceBlockLabel(p, districtData, lang) || p.block_id);
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [basePlaces, districtData, lang]);

  const placeOptions: SearchOption[] = useMemo(() => {
    const filtered = basePlaces.filter((p) => {
      if (selectedBlockFilter !== "all" && p.block_id !== selectedBlockFilter) {
        return false;
      }
      if (placeFilter === "all") return true;
      if (placeFilter === "block") return p.id.startsWith("block-");
      if (placeFilter === "village") return p.type === "village" && !p.id.startsWith("block-");
      return p.type === "ward";
    });
    const list = filtered.length > 0 ? filtered : places;
    return list.map((p) => ({
      id: p.id,
      label: getLocalized(p, "name", lang),
      sublabel: formatPlaceSublabel(p, lang),
      searchValue: `${p.name_en} ${p.name_hi} ${p.block_name_en || ""} ${p.block_name_hi || ""} ${p.tehsil_name_en || ""} ${p.block_id || ""} ${p.gp_id || ""} ${p.pincodes?.join(" ") || ""}`,
    }));
  }, [basePlaces, places, selectedBlockFilter, placeFilter, lang]);

  const currentPlace = useMemo(
    () => (selectedPlace && selectedPlace !== "district-hq" ? places.find((p) => p.id === selectedPlace) || null : null),
    [places, selectedPlace]
  );

  const resolution = useMemo(() => {
    if (!selectedDistrict || !districtData) return null;
    if (!selectedPlace) return null;
    const effType = currentPlace?.local_body_type || "unknown";
    return resolveOfficers(
      effType,
      selectedDistrict,
      selectedPlace === "district-hq" ? null : selectedPlace,
      districtData,
      places,
      stateData || undefined,
      recheckIds
    );
  }, [selectedDistrict, districtData, selectedPlace, currentPlace, places, stateData, recheckIds]);

  const issueStepsData = useMemo(() => {
    if (!issue) return null;
    return getIssueAreaSteps(
      issue,
      currentPlace?.local_body_type || "unknown",
      resolution
    );
  }, [issue, currentPlace, resolution]);

  const primaryOfficer = useMemo(() => {
    if (!issue || !resolution) return null;
    return getPrimaryOfficerForIssue(issue.slug, resolution);
  }, [issue, resolution]);

  const relevantPortals = useMemo(() => {
    if (!issue) return [];
    return getRelevantPortals(issue.slug, currentPlace?.local_body_type, stateData);
  }, [issue, currentPlace, stateData]);

  // Save resolved district + place cleanly for quick reuse across home & issue pages
  useEffect(() => {
    if (!selectedDistrict || !selectedPlace || !districtData) return;
    const distMeta = districts.find((d) => d.id === selectedDistrict);
    saveArea({
      districtId: selectedDistrict,
      districtNameEn: distMeta?.name_en || selectedDistrict,
      districtNameHi: distMeta?.name_hi || selectedDistrict,
      placeId: selectedPlace,
      placeNameEn: currentPlace?.name_en || (selectedPlace === "district-hq" ? "District HQ" : selectedPlace),
      placeNameHi: currentPlace?.name_hi || (selectedPlace === "district-hq" ? "जनपद मुख्यालय" : selectedPlace),
      localBodyType: currentPlace?.local_body_type || "unknown",
      pincode: pinInput.length === 6 ? pinInput : currentPlace?.pincodes?.[0],
    });
  }, [selectedDistrict, selectedPlace, districtData, districts, currentPlace, pinInput]);

  if (!issue) {
    return <div className="py-12 text-center text-muted">{t("common.loading")}</div>;
  }

  const title = lang === "hi" ? issue.title_hi : issue.title_en;
  const keepItems = lang === "hi" ? issue.keep_hi : issue.keep_en;
  const primaryPhone =
    primaryOfficer?.office.phones?.find((p) => p.status !== "failed") || null;
  const primaryFallback =
    primaryOfficer?.noPhone && primaryOfficer.office.fallback_office_id && districtData
      ? districtData.offices.find((o) => o.id === primaryOfficer.office.fallback_office_id)
      : null;
  const primaryFallbackPhone =
    primaryFallback?.phones?.find((p) => p.status !== "failed") || null;

  const letterOfficerParam = primaryOfficer
    ? getLocalized(primaryOfficer.office, "office_name", lang)
    : "";
  const pinSuffix = pinInput.length === 6 ? `&pincode=${encodeURIComponent(pinInput)}` : "";
  const letterQs = `district=${encodeURIComponent(selectedDistrict || "")}&place=${encodeURIComponent(
    selectedPlace === "district-hq" ? "" : selectedPlace || ""
  )}&issue=${encodeURIComponent(slug)}&officer=${encodeURIComponent(letterOfficerParam)}${pinSuffix}`;

  const handleCopy1076Summary = async () => {
    const distMeta = districts.find((d) => d.id === selectedDistrict) || null;
    const summaryText = build1076ComplaintSummary({
      lang,
      district: distMeta,
      districtData,
      place: currentPlace,
      issue,
      primaryOfficer,
      pincode: pinInput,
    });
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied1076(true);
      setTimeout(() => setCopied1076(false), 2500);
    } catch {}
  };

  const sequenceStep = resolution ? 3 : 2;

  return (
    <div className="max-w-form mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Breadcrumbs variant="supporting">
            <BreadcrumbItem href="/">{t("nav.home")}</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{title}</BreadcrumbItem>
          </Breadcrumbs>

          {/* Compact Step Sequence Indicator */}
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-[#EBF1F6] text-[#154273]">
              1. {t("issue.seqStep1")}
            </span>
            <span aria-hidden="true" className="text-muted">→</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                selectedDistrict && selectedPlace
                  ? "bg-[#EBF1F6] text-[#154273]"
                  : "bg-[#154273] text-white"
              }`}
            >
              2. {t("issue.seqStep2")}
            </span>
            <span aria-hidden="true" className="text-muted">→</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                sequenceStep === 3
                  ? "bg-[#C84B16] text-white"
                  : "bg-mutedSurface text-muted"
              }`}
            >
              3. {t("issue.seqStep3")}
            </span>
          </div>
        </div>

        <h1 className="page-title text-text">
          {title}
        </h1>

        {/* Quick 6-Issue Switcher preserving selected area */}
        <div className="flex flex-wrap gap-2" aria-label={t("issue.switchTopic")}>
          {ISSUE_LIST.map((item) => {
            const active = item.slug === slug;
            const qs = new URLSearchParams();
            if (selectedDistrict) qs.set("district", selectedDistrict);
            if (selectedPlace) qs.set("place", selectedPlace);
            if (pinInput.length === 6) qs.set("pincode", pinInput);
            const href = qs.toString()
              ? `/issue/${item.slug}/?${qs.toString()}`
              : `/issue/${item.slug}/`;
            return (
              <Link
                key={item.slug}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium border transition-colors ${
                  active
                    ? "bg-[#154273] text-white border-[#154273] shadow-sm"
                    : "bg-surface text-text border-border hover:border-[#154273]"
                }`}
              >
                {t(item.titleKey)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Selected Area Summary Bar */}
      {selectedDistrict && selectedPlace && !editingArea && (
        <div className="p-4 rounded-[12px] bg-[#EBF1F6] border border-[#C6D4E2] flex flex-wrap items-center justify-between gap-3 text-[15px]">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#154273] block">
              ✓{" "}
              {currentPlace
                ? getLocalized(currentPlace, "name", lang)
                : t("flow.districtSupervisoryLabel")}{" "}
              · {getDistrictName(selectedDistrict)}
            </span>
            {currentPlace && formatPlaceBlockAndTehsil(currentPlace, districtData, lang) && (
              <span className="text-[13px] text-muted block">
                {formatPlaceBlockAndTehsil(currentPlace, districtData, lang)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditingArea(true)}
            className="text-[13px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
          >
            {t("flow.change")}
          </button>
        </div>
      )}

      {/* STEP 2 PANEL: Inline PIN + District + Village/Block/Town Selector */}
      {editingArea && (
        <div className="p-5 sm:p-6 rounded-[12px] border border-border bg-surface shadow-[0_1px_3px_rgba(22,27,34,0.04)] overflow-visible">
          <div className="space-y-4">
            <div className="border-l-[3px] border-[#C84B16] pl-3.5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C84B16]">
                {t("issue.seqStep2")}
              </p>
              <Heading level={2}>{t("issue.areaHeading")}</Heading>
              <Text as="p" display="block" type="supporting" color="secondary">
                {t("issue.areaSub")}
              </Text>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Quick 6-digit PIN */}
              <div className="space-y-1.5">
                <label
                  htmlFor="issue-pin-input"
                  className="block text-[12px] font-bold uppercase tracking-[0.06em] text-muted"
                >
                  {t("flow.quickPincode")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="issue-pin-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    enterKeyHint="next"
                    maxLength={6}
                    value={pinInput}
                    onFocus={ensurePincodesLoaded}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                      pinEditedRef.current = true;
                      if (clean.length >= 1) ensurePincodesLoaded();
                      if (clean.length < 6) lastAutoAppliedPinRef.current = null;
                      setPinInput(clean);
                    }}
                    placeholder={t("flow.pincodePlaceholder")}
                    className="flex-1 min-h-[46px] px-3.5 py-2 bg-[#FAF9F6] focus:bg-surface text-text text-[16px] tabular-nums border border-[#A8A295] rounded-[8px] focus:border-[#154273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154273]/25 transition-colors"
                  />
                  {pinInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setPinInput("");
                        setSelectedDistrict("");
                        setSelectedPlace("");
                        syncUrl("", "", "");
                      }}
                      className="text-[13px] text-muted hover:text-danger px-2 py-1"
                    >
                      {t("flow.pincodeClear")}
                    </button>
                  )}
                </div>

                {pinState.matches.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pinState.matches.map((m) => (
                      <Button
                        key={m.district_id}
                        type="button"
                        size="sm"
                        variant={selectedDistrict === m.district_id ? "primary" : "secondary"}
                        label={getDistrictName(m.district_id)}
                        onClick={() => {
                          setSelectedDistrict(m.district_id);
                          setSelectedPlace("");
                          syncUrl(m.district_id, "", pinInput);
                        }}
                      />
                    ))}
                  </div>
                )}

                {pinState.kind === "not_found" && !pinState.isCheckingLive && (
                  <Banner status="warning" container="card" title={t("flow.pincodeNotFound")} />
                )}
              </div>

              {/* District SearchSelect */}
              <SearchSelect
                label={t("flow.selectDistrict")}
                options={districtOptions}
                value={selectedDistrict || null}
                onSelect={(opt) => {
                  const matchesPin = pinState.matches.some((m) => m.district_id === opt.id);
                  const nextPin = pinInput && !matchesPin ? "" : pinInput;
                  if (pinInput && !matchesPin) {
                    lastAutoAppliedPinRef.current = null;
                    setPinInput("");
                  }
                  setSelectedDistrict(opt.id);
                  setSelectedPlace("");
                  syncUrl(opt.id, "", nextPin);
                }}
              />
            </div>

            {/* Village / Block / Town Picker once District is chosen */}
            {selectedDistrict && (
              <div className="pt-4 border-t border-border space-y-3.5">
                {pinMatchedPlaces.length > 0 && (
                  <div className="p-3 rounded-[8px] bg-[#FAF9F6] border border-border flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-text">
                      {t("find.pinMatchesSummary", {
                        pin: pinInput,
                        count: pinMatchedPlaces.length,
                      })}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPinScope("pin")}
                        className={`px-3 py-1 text-[12px] font-semibold rounded-[8px] border transition-colors ${
                          pinScope === "pin"
                            ? "bg-[#154273] text-white border-[#154273]"
                            : "bg-surface text-muted border-border hover:border-[#154273]"
                        }`}
                      >
                        {t("find.pinFilteredPlacesToggle", {
                          pin: pinInput,
                          count: pinMatchedPlaces.length,
                        })}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPinScope("all")}
                        className={`px-3 py-1 text-[12px] font-semibold rounded-[8px] border transition-colors ${
                          pinScope === "all"
                            ? "bg-[#154273] text-white border-[#154273]"
                            : "bg-surface text-muted border-border hover:border-[#154273]"
                        }`}
                      >
                        {t("find.allPlacesToggle", {
                          district: getDistrictName(selectedDistrict),
                          count: places.length,
                        })}
                      </button>
                    </div>
                  </div>
                )}

                {uniqueBlocks.length > 1 && placeFilter !== "ward" && (
                  <div>
                    <label
                      htmlFor="issue-block-filter"
                      className="block text-[12px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5"
                    >
                      {t("find.blockFilterLabel")}
                    </label>
                    <select
                      id="issue-block-filter"
                      value={selectedBlockFilter}
                      onChange={(e) => setSelectedBlockFilter(e.target.value)}
                      className="civic-select w-full min-h-[46px] px-3.5 py-2 bg-[#FAF9F6] focus:bg-surface text-text text-[14px] border border-[#A8A295] rounded-[8px] focus:border-[#154273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154273]/25 transition-colors"
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

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">
                    {t("issue.filterAreaType")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "all", key: "flow.filterAll" },
                        { id: "village", key: "flow.filterVillage" },
                        { id: "block", key: "flow.filterBlock" },
                        { id: "ward", key: "flow.filterTown" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setPlaceFilter(f.id)}
                        className={`px-3 py-1 text-[12px] font-semibold rounded-[8px] border transition-colors ${
                          placeFilter === f.id
                            ? "bg-[#154273] text-white border-[#154273]"
                            : "bg-[#FAF9F6] text-muted border-border hover:border-[#154273]"
                        }`}
                      >
                        {t(f.key)}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingArea ? (
                  <p className="text-[14px] text-muted">{t("common.loading")}</p>
                ) : (
                  <div className="space-y-2.5">
                    <SearchSelect
                      label={t("issue.selectPlaceLabel")}
                      options={placeOptions}
                      value={selectedPlace && selectedPlace !== "district-hq" ? selectedPlace : null}
                      onSelect={(opt) => {
                        setSelectedPlace(opt.id);
                        setEditingArea(false);
                        syncUrl(selectedDistrict, opt.id, pinInput);
                      }}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlace("district-hq");
                          setEditingArea(false);
                          syncUrl(selectedDistrict, "district-hq", pinInput);
                        }}
                        className="text-[13px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                      >
                        {t("flow.skipPlace")} →
                      </button>
                      <Link
                        href={`/find/?issue=${encodeURIComponent(slug)}&district=${encodeURIComponent(
                          selectedDistrict
                        )}${pinSuffix}`}
                        className="text-[13px] font-semibold text-muted hover:text-[#154273] underline underline-offset-4"
                      >
                        {t("issue.openGuidedFinder")} ↗
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!selectedDistrict && (
              <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span className="text-muted">{t("issue.notSureAreaHint")}</span>
                <Link
                  href={`/find/?issue=${encodeURIComponent(slug)}${pinSuffix}`}
                  className="font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                >
                  {t("issue.openGuidedFinder")} →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MGNREGA urban/authority notice */}
      {issueStepsData?.isRuralOnlyNotice && (
        <Banner
          status="info"
          container="card"
          title={t("issue.mgnregaRuralOnly")}
        />
      )}

      {resolution?.secretaryNotIndexed && (
        <Banner
          status="info"
          container="card"
          title={t("results.secretaryDirectoryTitle")}
          description={t("results.secretaryDirectoryNote")}
        />
      )}

      {/* STEP 3 ACTION PANEL: Direct Contact + 1076 Summary + Official Portal + Letter/RTI */}
      {resolution && primaryOfficer && (
        <Card padding={5} variant="default" elevation="low">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C84B16]">
                  {t("issue.doFirstEyebrow")}
                </p>
                <Heading level={2}>{t("issue.doFirstTitle")}</Heading>
              </div>
              <Badge
                variant="info"
                label={t(`role.${primaryOfficer.resolvedRole}`)}
              />
            </div>

            <div className="p-4 rounded-[10px] bg-[#F2F6FA] border border-[#C6D4E2] space-y-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[18px] text-text leading-snug">
                    {getLocalized(primaryOfficer.office, "office_name", lang)}
                  </h3>
                  {getLocalized(primaryOfficer.office, "officer_name", lang) && (
                    <p className="text-[14px] text-muted mt-0.5">
                      {getLocalized(primaryOfficer.office, "officer_name", lang)}
                    </p>
                  )}
                </div>
                {primaryPhone && <VerifiedBadge phone={primaryPhone} />}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-[#D9E3EC]">
                {primaryPhone ? (
                  <CallButton number={primaryPhone.number} />
                ) : primaryFallbackPhone ? (
                  <CallButton number={primaryFallbackPhone.number} />
                ) : null}

                <Link
                  href={`/letter/?${letterQs}`}
                  className="min-h-[44px] inline-flex items-center justify-center px-5 py-2 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[8px] transition-colors text-[14.5px]"
                >
                  {t("issue.writeComplaintBtn")} →
                </Link>

                <Link
                  href={`/rti/?${letterQs}`}
                  className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 bg-surface hover:bg-[#FAF9F6] border border-[#A8A295] text-text font-semibold rounded-[8px] transition-colors text-[14.5px]"
                >
                  {t("results.rtiBtn")}
                </Link>

                <button
                  type="button"
                  onClick={handleCopy1076Summary}
                  className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 bg-surface hover:bg-[#EBF1F6] border border-[#154273] text-[#154273] font-semibold rounded-[8px] transition-colors text-[13.5px]"
                >
                  {copied1076 ? t("summary.copied1076") : t("summary.copy1076")}
                </button>
              </div>
            </div>

            {/* Online Portals & Helplines matched to this issue & area */}
            <div className="p-4 rounded-[10px] bg-[#0F2C4C] text-white space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#F39C72]">
                {t("issue.onlineHelplineLabel")}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`tel:${stateData?.cm_helpline?.number || "1076"}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C84B16] hover:bg-[#AD3E0F] text-white font-semibold rounded-[8px] text-[14px] tabular-nums transition-colors"
                >
                  {t("helpline.call")}
                </a>
                <a
                  href={stateData?.jansunwai?.url || "https://jansunwai.up.nic.in"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/30 hover:bg-white/10 text-white font-medium rounded-[8px] text-[14px] transition-colors"
                >
                  <span>{t("results.jansunwaiLinkText")}</span>
                  <span aria-hidden="true">↗</span>
                </a>
                {relevantPortals.map((portal) => (
                  <React.Fragment key={portal.id}>
                    {portal.helpline && (
                      <a
                        href={`tel:${portal.helpline.replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-[8px] text-[14px] tabular-nums transition-colors"
                      >
                        {t("results.call")} {portal.helpline}
                      </a>
                    )}
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/30 hover:bg-white/10 text-white font-medium rounded-[8px] text-[14px] transition-colors"
                    >
                      <span>{lang === "hi" ? portal.name_hi : portal.name_en}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Escalation Ladder Section (with exact local Call buttons once area is picked) */}
      <Card padding={5} variant="default" elevation="low">
        <section aria-labelledby="ladder-heading">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h2 id="ladder-heading" className="text-[22px] sm:text-[25px] font-bold text-text tracking-[-0.02em]">
              {t("ladder.title")}
            </h2>
            {issueStepsData?.isUrbanFlow && (
              <Badge variant="info" label={t("issue.urbanModeBadge")} />
            )}
          </div>

          <div>
            {(issueStepsData?.steps || []).map((entry, idx, arr) => (
              <LadderStep
                key={entry.step.order}
                step={entry.step}
                resolvedOfficer={entry.resolvedOfficer}
                fallbackOfficer={entry.fallbackOfficer}
                isPrimaryAction={idx === 0 && Boolean(entry.resolvedOfficer)}
                isLast={idx === arr.length - 1}
              />
            ))}
          </div>
        </section>
      </Card>

      <Checklist items={keepItems} />

      <Card padding={5} variant="muted" elevation="none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Heading level={3}>
              {t("letter.title")} / {t("rti.title")}
            </Heading>
            <Text as="p" display="block" type="supporting" color="secondary">
              {t("home.sub")}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/letter/?${letterQs}`}
              className="flex-1 sm:flex-none text-center min-h-[46px] inline-flex items-center justify-center px-5 py-2.5 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[8px] transition-colors text-[15px]"
            >
              {t("letter.title")}
            </Link>
            <Link
              href={`/rti/?${letterQs}`}
              className="flex-1 sm:flex-none text-center min-h-[46px] inline-flex items-center justify-center px-5 py-2.5 bg-surface hover:bg-[#FAF9F6] border border-[#A8A295] text-text font-semibold rounded-[8px] transition-colors text-[15px]"
            >
              {t("rti.title")}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function IssueClient({
  slug,
  initialIssue,
}: {
  slug: string;
  initialIssue: Issue | null;
}) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Loading...</div>}>
      <IssueView slug={slug} initialIssue={initialIssue} />
    </Suspense>
  );
}
