"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
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
} from "@/lib/data";
import { resolveOfficers, ResolutionResult } from "@/lib/resolver";
import {
  ISSUE_LIST,
  getPrimaryOfficerForIssue,
  getRelevantPortals,
} from "@/lib/issue-routing";
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
  const [stateInfo, setStateInfo] = useState<StateData | null>(null);

  const [currentDistrictData, setCurrentDistrictData] = useState<DistrictData | null>(null);
  const [currentPlaces, setCurrentPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const [selectedType, setSelectedType] = useState<LocalBodyType | "unknown" | "other" | null>(
    typeParam
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(districtParam);
  const [pinCandidateDistrict, setPinCandidateDistrict] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(placeParam);
  const [selectedIssue, setSelectedIssue] = useState<IssueSlug | null>(issueParam);
  const [pincodeInput, setPincodeInput] = useState(pincodeParam || "");
  const [unknownChoice, setUnknownChoice] = useState<"village" | "town" | null>(null);
  const [placeFilter, setPlaceFilter] = useState<"all" | "village" | "block" | "ward">("all");

  // Prevents URL sync or Back/Change click from immediately re-auto-applying PIN over user's intent
  const userClearedDistrictRef = useRef(false);

  const pinState = usePincodeLookup(pincodeInput, pincodesMap);

  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    loadPincodes().then(setPincodesMap);
    loadStateData().then(setStateInfo);
  }, []);

  // Sync URL params safely without wiping a valid PIN-detected district unless URL explicitly specifies district
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

  // Keep pincodeInput synced when URL ?pincode= changes
  useEffect(() => {
    if (!pincodeParam) return;
    const clean = pincodeParam.replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6) setPincodeInput(clean);
  }, [pincodeParam]);

  // Apply PIN resolution cleanly for Step 1 auto-detect & Step 2 confirmation
  useEffect(() => {
    if (pincodeInput.length !== 6) {
      setPinCandidateDistrict(null);
      return;
    }
    if (pinState.matches.length === 1 && !userClearedDistrictRef.current) {
      const matchDist = pinState.matches[0].district_id;
      if (!selectedType) {
        setSelectedDistrict(matchDist);
      } else if (!selectedDistrict) {
        setPinCandidateDistrict(matchDist);
      }
    } else {
      setPinCandidateDistrict(null);
    }
  }, [pincodeInput, pinState.matches, selectedType, selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict) {
      setLoadingPlaces(true);
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

  let step = 1;
  if (selectedType) {
    if (selectedType === "other") {
      step = selectedDistrict ? 4 : 2;
    } else if (selectedDistrict) {
      step = selectedPlace ? 4 : 3;
    } else {
      step = 2;
    }
  }

  const getDistrictName = (id: string) => {
    const dEntry = districts.find((d) => d.id === id);
    return dEntry ? getLocalized(dEntry, "name", lang) : id;
  };

  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, "").slice(0, 6);
    setPincodeInput(cleanPin);
    userClearedDistrictRef.current = false;
  };

  const handleClearPincode = () => {
    userClearedDistrictRef.current = true;
    setPincodeInput("");
    setPinCandidateDistrict(null);
    setSelectedDistrict(null);
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

  const placeOptions: SearchOption[] = useMemo(() => {
    if (!currentPlaces.length) return [];
    const filteredPlaces = currentPlaces.filter((p) => {
      if (selectedType === "unknown" && unknownChoice) {
        if (unknownChoice === "village" && p.type !== "village") return false;
        if (unknownChoice === "town" && p.type !== "ward") return false;
      }
      if (placeFilter === "block") return p.id.startsWith("block-");
      if (placeFilter === "village") return p.type === "village" && !p.id.startsWith("block-");
      if (placeFilter === "ward") return p.type === "ward";
      return true;
    });
    return filteredPlaces.map((p) => {
      const name = getLocalized(p, "name", lang);
      let sub = "";
      if (p.type === "village") {
        sub = `${p.block_id ? `Block: ${p.block_id}` : ""}${p.pincodes?.[0] ? ` · PIN ${p.pincodes[0]}` : ""}`;
      } else {
        sub = `${p.ulb_id || p.tehsil_id || "-"}${p.pincodes?.[0] ? ` · PIN ${p.pincodes[0]}` : ""}`;
      }
      return {
        id: p.id,
        label: name,
        sublabel: sub,
        searchValue: `${p.name_en} ${p.name_hi} ${p.gp_id || ""} ${p.block_id || ""} ${p.pincodes?.join(" ") || ""}`,
      };
    });
  }, [currentPlaces, selectedType, unknownChoice, placeFilter, lang]);

  const resolution: ResolutionResult | null = useMemo(() => {
    if (step !== 4 || !selectedDistrict || !currentDistrictData) return null;
    return resolveOfficers(
      selectedType || "unknown",
      selectedDistrict,
      selectedPlace === "district-hq" ? null : selectedPlace,
      currentDistrictData,
      currentPlaces,
      stateInfo || undefined
    );
  }, [step, selectedType, selectedDistrict, selectedPlace, currentDistrictData, currentPlaces, stateInfo]);

  const activeIssueSlug: IssueSlug = selectedIssue || "street-light";
  const primaryIssueOfficer = useMemo(() => {
    if (!resolution || !selectedIssue) return resolution?.officers[0] || null;
    return getPrimaryOfficerForIssue(selectedIssue, resolution);
  }, [resolution, selectedIssue]);

  const issuePortals = useMemo(() => {
    const effLocalType = resolution?.place?.local_body_type || selectedType || "unknown";
    return getRelevantPortals(activeIssueSlug, effLocalType, stateInfo);
  }, [activeIssueSlug, resolution, selectedType, stateInfo]);

  const handleBack = () => {
    if (step === 4) {
      if (selectedType === "other") {
        userClearedDistrictRef.current = true;
        setSelectedDistrict(null);
        updateUrl(selectedType, null, null);
      } else {
        setSelectedPlace(null);
        updateUrl(selectedType, selectedDistrict, null);
      }
    } else if (step === 3) {
      userClearedDistrictRef.current = true;
      setSelectedDistrict(null);
      updateUrl(selectedType, null, null);
    } else if (step === 2) {
      setSelectedType(null);
      updateUrl(null, selectedDistrict, null);
    }
  };

  // Pick a district resolved synchronously or from state when Step 1 ballot is chosen
  const selectBallotAndProceed = (ballot: LocalBodyType | "unknown" | "other") => {
    setSelectedType(ballot);
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
    updateUrl(ballot, effDistrict, ballot === "other" ? null : selectedPlace);
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === 1) {
      setSelectedType(null);
      setSelectedPlace(null);
      updateUrl(null, selectedDistrict, null);
    } else if (targetStep === 2) {
      userClearedDistrictRef.current = true;
      setSelectedDistrict(null);
      setSelectedPlace(null);
      updateUrl(selectedType, null, null);
    }
  };

  return (
    <div className="max-w-form mx-auto">
      {step < 4 && (
        <Stepper
          currentStep={step}
          totalSteps={3}
          canBack={step > 1}
          onBack={handleBack}
          onStepClick={handleStepClick}
        />
      )}

      {/* Selected Issue Context Banner when arriving from an issue page */}
      {selectedIssue && step < 4 && (
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

      {/* Selected District Context Banner (visible on Steps 1 & 3 so PIN auto-detection is always transparent) */}
      {selectedDistrict && (step === 1 || step === 3) && (
        <div className="mb-5 p-3.5 rounded-[4px] bg-[#EBF1F6] border border-[#154273]/30 flex flex-wrap items-center justify-between gap-2 text-[14px]">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#154273] block">
              ✓ {t("flow.pincodeSelectedBar", { district: getDistrictName(selectedDistrict) })}
              {pincodeInput.length === 6 && ` (PIN ${pincodeInput})`}
            </span>
            {pinState.localitySummary && (
              <span className="text-[12px] text-muted block">
                {t("flow.pincodeAreaHint", { area: pinState.localitySummary })}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {step === 1 && (
              <button
                type="button"
                onClick={() => selectBallotAndProceed("unknown")}
                className="text-[13px] font-semibold text-[#C84B16] underline hover:text-[#AD3E0F]"
              >
                {t("find.jumpToPlaceSearch")} →
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                userClearedDistrictRef.current = true;
                setSelectedDistrict(null);
                setSelectedPlace(null);
                updateUrl(selectedType, null, null);
              }}
              className="text-[13px] font-semibold text-[#154273] underline hover:text-[#0F3156]"
            >
              {t("flow.changeDistrict")}
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Ballot Choice + Optional Issue Quick Select */}
      {step === 1 && (
        <section aria-labelledby="q1-heading" className="space-y-5">
          <div>
            <h1 id="q1-heading" className="font-editorial text-[28px] sm:text-[34px] font-bold text-text leading-tight mb-2">
              {t("flow.q1")}
            </h1>
            <p className="text-[16px] text-muted leading-relaxed">
              {t("find.step1FriendlyHint")}
            </p>
          </div>

          {/* Optional Issue Pills so citizen can tag what they want to complain about upfront */}
          <div className="space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">
              {t("find.optionalIssueTitle")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ISSUE_LIST.map((item) => {
                const active = selectedIssue === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => {
                      const next = active ? null : item.slug;
                      setSelectedIssue(next);
                      updateUrl(selectedType, selectedDistrict, selectedPlace, undefined, next);
                    }}
                    className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium border transition-colors ${
                      active
                        ? "bg-[#C84B16] text-white border-[#C84B16]"
                        : "bg-surface text-text border-border hover:border-[#154273]"
                    }`}
                  >
                    {t(item.titleKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <Card padding={4} variant="default" elevation="none">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-[15px] text-text block">
                    {t("flow.quickPincode")}
                  </span>
                  <span className="text-[13px] text-muted block">
                    {t("flow.pincodePlaceholder")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="226001"
                    className="w-36 min-h-[42px] px-3 py-1.5 bg-bg text-text text-[15px] tabular-nums border border-borderStrong rounded-[4px] focus:border-[#154273] focus-visible:outline-none"
                  />
                  {pinState.matches.length === 1 && selectedDistrict && (
                    <Badge
                      variant="success"
                      label={getDistrictName(selectedDistrict)}
                    />
                  )}
                  {pincodeInput && (
                    <button
                      type="button"
                      onClick={handleClearPincode}
                      aria-label={t("flow.pincodeClear")}
                      className="text-[13px] text-muted hover:text-danger px-2 py-1"
                    >
                      ✕
                    </button>
                  )}
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
            </div>
          </Card>

          <div className="space-y-2.5">
            <ChoiceButton
              title={t("flow.q1.pradhan")}
              subtitle={t("flow.q1.pradhanSub")}
              selected={selectedType === "gram_panchayat"}
              onClick={() => selectBallotAndProceed("gram_panchayat")}
            />
            <ChoiceButton
              title={t("flow.q1.np")}
              subtitle={t("flow.q1.npSub")}
              selected={selectedType === "nagar_panchayat"}
              onClick={() => selectBallotAndProceed("nagar_panchayat")}
            />
            <ChoiceButton
              title={t("flow.q1.npp")}
              subtitle={t("flow.q1.nppSub")}
              selected={selectedType === "nagar_palika_parishad"}
              onClick={() => selectBallotAndProceed("nagar_palika_parishad")}
            />
            <ChoiceButton
              title={t("flow.q1.mayor")}
              subtitle={t("flow.q1.mayorSub")}
              selected={selectedType === "nagar_nigam"}
              onClick={() => selectBallotAndProceed("nagar_nigam")}
            />
            <ChoiceButton
              title={t("flow.q1.other")}
              subtitle={t("flow.q1.otherSub")}
              selected={selectedType === "other"}
              onClick={() => selectBallotAndProceed("other")}
            />
            <ChoiceButton
              title={t("flow.q1.unsure")}
              subtitle={t("flow.q1.unsureSub")}
              selected={selectedType === "unknown"}
              onClick={() => selectBallotAndProceed("unknown")}
            />
          </div>
        </section>
      )}

      {/* STEP 2: District & Pincode */}
      {step === 2 && (
        <section aria-labelledby="q2-heading" className="space-y-5">
          <h1 id="q2-heading" className="font-editorial text-[28px] sm:text-[34px] font-bold text-text leading-tight">
            {t("flow.q2")}
          </h1>

          <Card padding={4} variant="default" elevation="none">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="pincode-input" className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted">
                  {t("flow.pincode")}
                </label>
                {pincodeInput && (
                  <button
                    type="button"
                    onClick={handleClearPincode}
                    className="text-[13px] text-muted hover:text-danger font-medium underline"
                  >
                    {t("flow.pincodeClear")}
                  </button>
                )}
              </div>

              <input
                id="pincode-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder={t("flow.pincodePlaceholder")}
                className="w-full min-h-btn px-4 py-2.5 bg-bg text-text text-[17px] font-medium tabular-nums border border-borderStrong rounded-[4px] focus:border-[#154273] focus-visible:outline-none"
              />

              {pinState.matches.length === 1 && (pinCandidateDistrict || selectedDistrict) && (
                <Banner
                  status="success"
                  container="card"
                  collapsible={false}
                  title={t(
                    pinState.kind === "exact" || pinState.kind === "live"
                      ? "flow.pincodeDetected"
                      : "flow.pincodePrefixDetected",
                    { district: getDistrictName((pinCandidateDistrict || selectedDistrict)!) }
                  )}
                  description={
                    pinState.localitySummary
                      ? t("flow.pincodeAreaHint", { area: pinState.localitySummary })
                      : undefined
                  }
                >
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      label={`${t("flow.continueDistrict", { district: getDistrictName((pinCandidateDistrict || selectedDistrict)!) })} →`}
                      onClick={() => {
                        const target = (pinCandidateDistrict || selectedDistrict)!;
                        userClearedDistrictRef.current = false;
                        setSelectedDistrict(target);
                        setPinCandidateDistrict(null);
                        updateUrl(selectedType, target, null, pincodeInput);
                      }}
                    />
                  </div>
                </Banner>
              )}

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
                    {pinState.matches.map((m) => {
                      const dName = getDistrictName(m.district_id);
                      const isChosen = selectedDistrict === m.district_id;
                      return (
                        <Button
                          key={m.district_id}
                          type="button"
                          size="sm"
                          variant={isChosen ? "primary" : "secondary"}
                          label={dName}
                          onClick={() => {
                            setSelectedDistrict(m.district_id);
                            updateUrl(selectedType, m.district_id, null, pincodeInput);
                          }}
                        />
                      );
                    })}
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
            </div>
          </Card>

          <SearchSelect
            label={t("flow.selectDistrict")}
            options={districtOptions}
            value={selectedDistrict}
            onSelect={(opt) => {
              userClearedDistrictRef.current = false;
              setSelectedDistrict(opt.id);
              updateUrl(selectedType, opt.id, null);
            }}
          />
        </section>
      )}

      {/* STEP 3: Place (Village / Ward) */}
      {step === 3 && (
        <section aria-labelledby="q3-heading" className="space-y-5">
          <h1 id="q3-heading" className="font-editorial text-[28px] sm:text-[34px] font-bold text-text leading-tight">
            {selectedType === "unknown" && !unknownChoice
              ? t("flow.unknownHeading")
              : selectedType === "gram_panchayat" || unknownChoice === "village"
              ? t("flow.q3.village")
              : t("flow.q3.ward")}
          </h1>

          {selectedType === "unknown" && !unknownChoice && currentPlaces.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  label={t("flow.village")}
                  onClick={() => setUnknownChoice("village")}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  label={t("flow.town")}
                  onClick={() => setUnknownChoice("town")}
                />
              </div>
            </div>
          )}

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
                district: selectedDistrict ? getDistrictName(selectedDistrict) : "",
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
              {currentPlaces.length > 20 && (
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
                        className={`px-2.5 py-1 text-[12px] font-semibold rounded-[4px] border transition-colors ${
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
                    : selectedType === "gram_panchayat" || unknownChoice === "village"
                    ? t("flow.q3.village")
                    : t("flow.q3.ward")
                }
                options={placeOptions}
                value={selectedPlace}
                onSelect={(opt) => {
                  setSelectedPlace(opt.id);
                  updateUrl(selectedType, selectedDistrict, opt.id);
                }}
              />

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPlaceFilter("block")}
                  className="text-[14px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                >
                  {t("flow.pickBlockFallback")}
                </button>
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

      {/* STEP 4: Results "Your officers" */}
      {step === 4 && resolution && (
        <section aria-labelledby="results-heading" className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              label={t("flow.back")}
              onClick={handleBack}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              }
            />
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

          <h1 id="results-heading" className="font-editorial text-[30px] sm:text-[36px] font-bold text-text leading-tight">
            {t("results.title")}
          </h1>

          {resolution.place ? (
            <div className="p-4 rounded-[6px] bg-surface border border-border border-l-4 border-l-[#154273] flex flex-wrap items-center justify-between gap-2 text-[15px] text-text font-medium">
              <span>
                {getLocalized(resolution.place, "name", lang)}
                {resolution.place.gp_id && ` · GP: ${resolution.place.gp_id}`}
                {resolution.place.block_id && ` · Block: ${resolution.place.block_id}`}
                {resolution.place.tehsil_id && ` · Tehsil: ${resolution.place.tehsil_id}`}
                {selectedDistrict && ` · ${getDistrictName(selectedDistrict)}`}
              </span>
              <button
                type="button"
                onClick={() => handleStepClick(2)}
                className="text-[13px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
              >
                {t("flow.change")}
              </button>
            </div>
          ) : selectedDistrict ? (
            <div className="p-4 rounded-[6px] bg-surface border border-border border-l-4 border-l-[#154273] flex flex-wrap items-center justify-between gap-2 text-[15px] text-text font-medium">
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

          {resolution.hasCoverageGap && <CoverageBanner />}

          {resolution.isCantonmentOrOther && (
            <Banner
              status="info"
              container="card"
              title={t("results.cantonmentTitle")}
              description={t("results.cantonmentDesc")}
            />
          )}

          {/* Dutch Civic Sequence Box: What problem are you fixing? Highlight 1st officer & exact actions */}
          <Card padding={4} variant="default" elevation="none">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C84B16]">
                    {t("find.actionPlanEyebrow")}
                  </p>
                  <h2 className="font-editorial text-[20px] font-bold text-text">
                    {t("find.pickProblemPrompt")}
                  </h2>
                </div>
                {selectedIssue && (
                  <Link
                    href={`/issue/${selectedIssue}/?district=${encodeURIComponent(
                      selectedDistrict || ""
                    )}&place=${encodeURIComponent(
                      selectedPlace === "district-hq" ? "" : selectedPlace || ""
                    )}`}
                    className="text-[13px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                  >
                    {t("find.viewFullLadder")} →
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ISSUE_LIST.map((item) => {
                  const active = selectedIssue === item.slug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => {
                        setSelectedIssue(item.slug);
                        updateUrl(selectedType, selectedDistrict, selectedPlace, undefined, item.slug);
                      }}
                      className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium border transition-colors ${
                        active
                          ? "bg-[#154273] text-white border-[#154273]"
                          : "bg-bg text-text border-border hover:border-[#154273]"
                      }`}
                    >
                      {t(item.titleKey)}
                    </button>
                  );
                })}
              </div>

              {selectedIssue && primaryIssueOfficer && (
                <div className="p-3.5 rounded-[4px] bg-[#EBF1F6]/70 border border-[#154273]/25 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#C84B16] block">
                        1. {t("issue.doFirstTitle")} — {t(`issue.${selectedIssue}`)}
                      </span>
                      <span className="font-semibold text-[16px] text-text block">
                        {getLocalized(primaryIssueOfficer.office, "office_name", lang)}
                      </span>
                    </div>
                    {primaryIssueOfficer.office.phones?.[0] && (
                      <CallButton number={primaryIssueOfficer.office.phones[0].number} />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
                    <Link
                      href={`/letter/?district=${encodeURIComponent(
                        selectedDistrict || ""
                      )}&place=${encodeURIComponent(
                        selectedPlace === "district-hq" ? "" : selectedPlace || ""
                      )}&issue=${encodeURIComponent(selectedIssue)}&officer=${encodeURIComponent(
                        getLocalized(primaryIssueOfficer.office, "office_name", lang)
                      )}`}
                      className="px-3.5 py-1.5 rounded-[4px] bg-[#154273] text-white font-semibold hover:bg-[#0F3156]"
                    >
                      2. {t("issue.writeComplaintBtn")} →
                    </Link>
                    {issuePortals.map((portal) => (
                      <a
                        key={portal.id}
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-[4px] border border-borderStrong bg-surface text-text font-medium hover:border-[#154273]"
                      >
                        {lang === "hi" ? portal.name_hi : portal.name_en} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-4" aria-live="polite">
            {resolution.officers.map((item) => (
              <OfficerCard key={`${item.office.id}-${item.resolvedRole}`} item={item} />
            ))}

            {/* State Escalation Panel — Classic Royal Delft Navy */}
            <article className="p-6 bg-[#154273] text-white rounded-[6px] border-t-4 border-[#C84B16]">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#F39C72] mb-1.5">
                {t("results.stateOfficeTitle")}
              </p>
              <h3 className="font-editorial font-bold text-[22px] text-white">
                {t("helpline.bar")}
              </h3>
              <p className="text-[15px] text-[#DCE6F2] mt-1.5 mb-5 leading-relaxed">
                {t("results.stateOfficeDesc")}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`tel:${resolution.stateHelpline.number}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C84B16] hover:bg-[#AD3E0F] text-white font-semibold rounded-[4px] transition-colors tabular-nums"
                >
                  <span>{t("helpline.call")}</span>
                </a>
                <a
                  href={resolution.stateHelpline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-white/30 hover:bg-white/10 text-white font-medium rounded-[4px] transition-colors text-[15px]"
                >
                  <span>{t("results.jansunwaiLinkText")}</span>
                  <span aria-hidden="true">↗</span>
                </a>
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
            <h3 className="font-editorial font-bold text-[22px] text-text mb-4">
              {t("results.nextStepTitle")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href={`/issue/${encodeURIComponent(activeIssueSlug)}/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(
                  selectedPlace === "district-hq" ? "" : selectedPlace || ""
                )}`}
                className="p-4 rounded-[4px] border border-[#154273] bg-[#EBF1F6]/60 hover:bg-[#EBF1F6] text-[#154273] font-semibold text-center text-[15px] transition-colors"
              >
                {t("results.ladderBtn")}
              </Link>
              <Link
                href={`/letter/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(
                  selectedPlace === "district-hq" ? "" : selectedPlace || ""
                )}&issue=${encodeURIComponent(activeIssueSlug)}&officer=${encodeURIComponent(
                  primaryIssueOfficer
                    ? getLocalized(primaryIssueOfficer.office, "office_name", lang)
                    : resolution.officers[0]
                    ? getLocalized(resolution.officers[0].office, "office_name", lang)
                    : ""
                )}`}
                className="p-4 rounded-[4px] border border-borderStrong hover:border-[#154273] bg-surface text-text font-semibold text-center text-[15px] transition-colors"
              >
                {t("results.letterBtn")}
              </Link>
              <Link
                href={`/rti/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(
                  selectedPlace === "district-hq" ? "" : selectedPlace || ""
                )}&issue=${encodeURIComponent(activeIssueSlug)}&officer=${encodeURIComponent(
                  primaryIssueOfficer
                    ? getLocalized(primaryIssueOfficer.office, "office_name", lang)
                    : resolution.officers[0]
                    ? getLocalized(resolution.officers[0].office, "office_name", lang)
                    : ""
                )}`}
                className="p-4 rounded-[4px] border border-borderStrong hover:border-[#154273] bg-surface text-text font-semibold text-center text-[15px] transition-colors"
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
