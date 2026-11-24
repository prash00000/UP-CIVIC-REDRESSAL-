"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import {
  LocalBodyType,
  DistrictIndexEntry,
  DistrictData,
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
} from "@/lib/data";
import { resolveOfficers, ResolutionResult } from "@/lib/resolver";
import Stepper from "@/components/Stepper";
import ChoiceButton from "@/components/ChoiceButton";
import SearchSelect, { SearchOption } from "@/components/SearchSelect";
import OfficerCard from "@/components/OfficerCard";
import CoverageBanner from "@/components/CoverageBanner";

function WizardContent() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const typeParam = searchParams.get("type") as LocalBodyType | "unknown" | "other" | null;
  const districtParam = searchParams.get("district");
  const placeParam = searchParams.get("place");
  const pincodeParam = searchParams.get("pincode");

  // Loaded data
  const [districts, setDistricts] = useState<DistrictIndexEntry[]>([]);
  const [pincodesMap, setPincodesMap] = useState<PincodeMap>({});
  const [stateInfo, setStateInfo] = useState<StateData | null>(null);

  const [currentDistrictData, setCurrentDistrictData] = useState<DistrictData | null>(null);
  const [currentPlaces, setCurrentPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  // Form step state
  const [selectedType, setSelectedType] = useState<LocalBodyType | "unknown" | "other" | null>(
    typeParam
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(districtParam);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(placeParam);
  const [pincodeInput, setPincodeInput] = useState(pincodeParam || "");
  const [pincodeMatches, setPincodeMatches] = useState<{ district_id: string; tehsil_id?: string }[] | null>(null);
  const [pincodeNotFound, setPincodeNotFound] = useState(false);
  const [unknownChoice, setUnknownChoice] = useState<"village" | "town" | null>(null);

  // Load static index datasets once on mount
  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    loadPincodes().then(setPincodesMap);
    loadStateData().then(setStateInfo);
  }, []);

  // Sync state if URL changes (e.g. direct link or back button)
  useEffect(() => {
    setSelectedType(typeParam);
    setSelectedDistrict(districtParam);
    setSelectedPlace(placeParam);
  }, [typeParam, districtParam, placeParam]);

  // Initial pincode lookup when pincodesMap loads and pincodeParam exists
  useEffect(() => {
    if (pincodeParam && pincodesMap[pincodeParam.trim()]) {
      const clean = pincodeParam.trim();
      const matches = pincodesMap[clean];
      setPincodeInput(clean);
      setPincodeMatches(matches);
      if (matches.length === 1 && !selectedDistrict) {
        setSelectedDistrict(matches[0].district_id);
      }
    }
  }, [pincodeParam, pincodesMap, selectedDistrict]);

  // Load district-specific data when district is selected
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

  // Update URL helper without history spam
  const updateUrl = (
    newType: string | null,
    newDistrict: string | null,
    newPlace: string | null,
    newPin?: string | null
  ) => {
    const params = new URLSearchParams();
    if (newType) params.set("type", newType);
    if (newDistrict) params.set("district", newDistrict);
    if (newPlace) params.set("place", newPlace);
    const pin = newPin !== undefined ? newPin : pincodeInput;
    if (pin && pin.length === 6) params.set("pincode", pin);
    router.replace(`/find/?${params.toString()}`);
  };

  // Determine current wizard step: 1: ballot, 2: district, 3: place, 4: results
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

  // Handle Pincode entry
  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, "").slice(0, 6);
    setPincodeInput(cleanPin);

    if (cleanPin.length === 6) {
      const matches = pincodesMap[cleanPin];
      if (matches && matches.length > 0) {
        setPincodeMatches(matches);
        setPincodeNotFound(false);
        if (matches.length === 1) {
          const match = matches[0];
          setSelectedDistrict(match.district_id);
          updateUrl(selectedType, match.district_id, null, cleanPin);
        }
      } else {
        setPincodeMatches(null);
        setPincodeNotFound(true);
      }
    } else {
      setPincodeMatches(null);
      setPincodeNotFound(false);
    }
  };

  const handleClearPincode = () => {
    setPincodeInput("");
    setPincodeMatches(null);
    setPincodeNotFound(false);
  };

  // Options for District Search
  const districtOptions: SearchOption[] = useMemo(() => {
    return districts.map((d) => ({
      id: d.id,
      label: getLocalized(d, "name", lang),
      sublabel: `${t("directory.division", { division: getLocalized(d, "division", lang) })}`,
      searchValue: `${d.name_en} ${d.name_hi}`,
    }));
  }, [districts, lang, t]);

  // Options for Place Search
  const placeOptions: SearchOption[] = useMemo(() => {
    if (!currentPlaces.length) return [];
    return currentPlaces.map((p) => {
      const name = getLocalized(p, "name", lang);
      let sub = "";
      if (p.type === "village") {
        sub = `GP: ${p.gp_id || "-"} | Block: ${p.block_id || "-"}`;
      } else {
        sub = `ULB: ${p.ulb_id || "-"}`;
      }
      return {
        id: p.id,
        label: name,
        sublabel: sub,
        searchValue: `${p.name_en} ${p.name_hi} ${p.gp_id || ""} ${p.block_id || ""}`,
      };
    });
  }, [currentPlaces, lang]);

  // Resolved result if on result step
  const resolution: ResolutionResult | null = useMemo(() => {
    if (step !== 4 || !selectedDistrict || !currentDistrictData) return null;
    return resolveOfficers(
      selectedType || "unknown",
      selectedDistrict,
      selectedPlace,
      currentDistrictData,
      currentPlaces,
      stateInfo || undefined
    );
  }, [step, selectedType, selectedDistrict, selectedPlace, currentDistrictData, currentPlaces, stateInfo]);

  // Back button handler
  const handleBack = () => {
    if (step === 4) {
      if (selectedType === "other") {
        setSelectedDistrict(null);
        updateUrl(selectedType, null, null);
      } else {
        setSelectedPlace(null);
        updateUrl(selectedType, selectedDistrict, null);
      }
    } else if (step === 3) {
      setSelectedDistrict(null);
      updateUrl(selectedType, null, null);
    } else if (step === 2) {
      setSelectedType(null);
      updateUrl(null, null, null);
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
        />
      )}

      {/* STEP 1: Ballot Choice */}
      {step === 1 && (
        <section aria-labelledby="q1-heading" className="space-y-4">
          <h1 id="q1-heading" className="text-[26px] sm:text-[32px] font-bold text-text leading-tight mb-2">
            {t("flow.q1")}
          </h1>
          <p className="text-[16px] sm:text-[17px] text-muted mb-4 leading-relaxed">
            {t("home.step1Desc")}
          </p>

          {/* Quick PIN Code Search on Step 1 */}
          <div className="p-4 rounded-card bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="font-semibold text-[15px] text-text block">
                📮 {t("flow.quickPincode")}
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
                placeholder="e.g. 226001"
                className="w-36 min-h-[42px] px-3 py-1.5 bg-bg text-text text-[15px] border-2 border-border rounded-btn focus:border-primary focus-visible:outline-none"
              />
              {pincodeMatches && pincodeMatches.length > 0 && selectedDistrict && (
                <span className="text-[13px] font-bold text-success bg-success/10 border border-success/30 px-2.5 py-1.5 rounded-btn whitespace-nowrap">
                  ✓ {getLocalized(districts.find((d) => d.id === selectedDistrict), "name", lang)}
                </span>
              )}
              {pincodeInput && (
                <button
                  type="button"
                  onClick={handleClearPincode}
                  className="text-[13px] text-muted hover:text-danger px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <ChoiceButton
              title={t("flow.q1.pradhan")}
              subtitle="Rural Village / Gram Panchayat"
              selected={selectedType === "gram_panchayat"}
              onClick={() => {
                setSelectedType("gram_panchayat");
                updateUrl("gram_panchayat", selectedDistrict, selectedPlace);
              }}
            />
            <ChoiceButton
              title={t("flow.q1.np")}
              subtitle="Small Town / Nagar Panchayat"
              selected={selectedType === "nagar_panchayat"}
              onClick={() => {
                setSelectedType("nagar_panchayat");
                updateUrl("nagar_panchayat", selectedDistrict, selectedPlace);
              }}
            />
            <ChoiceButton
              title={t("flow.q1.npp")}
              subtitle="Municipality / Nagar Palika Parishad"
              selected={selectedType === "nagar_palika_parishad"}
              onClick={() => {
                setSelectedType("nagar_palika_parishad");
                updateUrl("nagar_palika_parishad", selectedDistrict, selectedPlace);
              }}
            />
            <ChoiceButton
              title={t("flow.q1.mayor")}
              subtitle="Municipal Corporation (Nagar Nigam / Metro)"
              selected={selectedType === "nagar_nigam"}
              onClick={() => {
                setSelectedType("nagar_nigam");
                updateUrl("nagar_nigam", selectedDistrict, selectedPlace);
              }}
            />
            <ChoiceButton
              title={t("flow.q1.other")}
              subtitle="Cantonment Board, Industrial Township, or Development Authority"
              selected={selectedType === "other"}
              onClick={() => {
                setSelectedType("other");
                updateUrl("other", selectedDistrict, null);
              }}
            />
            <ChoiceButton
              title={t("flow.q1.unsure")}
              subtitle="Not sure whether village or town"
              selected={selectedType === "unknown"}
              onClick={() => {
                setSelectedType("unknown");
                updateUrl("unknown", selectedDistrict, selectedPlace);
              }}
            />
          </div>
        </section>
      )}

      {/* STEP 2: District & Pincode */}
      {step === 2 && (
        <section aria-labelledby="q2-heading" className="space-y-5">
          <h1 id="q2-heading" className="text-[26px] sm:text-[32px] font-bold text-text leading-tight mb-2">
            {t("flow.q2")}
          </h1>

          {/* Pincode Helper */}
          <div className="p-5 rounded-card bg-surface border-2 border-border space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="pincode-input" className="block text-label font-bold text-text">
                📮 {t("flow.pincode")}
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

            <div className="relative">
              <input
                id="pincode-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder={t("flow.pincodePlaceholder")}
                className="w-full min-h-btn px-4 py-2.5 bg-bg text-text text-[17px] font-medium border-2 border-border rounded-btn focus:border-primary focus-visible:outline-none"
              />
            </div>

            {/* If single district detected */}
            {pincodeMatches && pincodeMatches.length === 1 && selectedDistrict && (
              <div className="p-3 rounded-btn bg-success/10 border border-success/30 text-success text-[15px] font-semibold flex items-center justify-between">
                <span>
                  ✓ {t("flow.pincodeDetected", {
                    district:
                      getLocalized(
                        districts.find((d) => d.id === selectedDistrict),
                        "name",
                        lang
                      ) || selectedDistrict,
                  })}
                </span>
                <span className="text-[13px] bg-success text-white px-2 py-0.5 rounded">
                  Selected
                </span>
              </div>
            )}

            {/* If multi-district border PIN detected */}
            {pincodeMatches && pincodeMatches.length > 1 && (
              <div className="p-3.5 rounded-btn bg-blue-50 border border-blue-200 text-blue-900 space-y-2 text-[14px]">
                <p className="font-semibold">{t("flow.pincodeMulti")}</p>
                <div className="flex flex-wrap gap-2">
                  {pincodeMatches.map((m) => {
                    const dEntry = districts.find((d) => d.id === m.district_id);
                    const dName = dEntry ? getLocalized(dEntry, "name", lang) : m.district_id;
                    const isChosen = selectedDistrict === m.district_id;
                    return (
                      <button
                        key={m.district_id}
                        type="button"
                        onClick={() => {
                          setSelectedDistrict(m.district_id);
                          updateUrl(selectedType, m.district_id, null, pincodeInput);
                        }}
                        className={`px-3 py-1.5 rounded-btn font-bold text-[14px] border transition-all ${
                          isChosen
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white text-text border-slate-300 hover:border-primary"
                        }`}
                      >
                        {dName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If not found */}
            {pincodeNotFound && (
              <div className="p-3 rounded-btn bg-amber-50 border border-amber-300 text-amber-900 text-[14px] leading-relaxed">
                {t("flow.pincodeNotFound")}
              </div>
            )}
          </div>

          {/* District Select */}
          <SearchSelect
            label={t("flow.selectDistrict")}
            options={districtOptions}
            value={selectedDistrict}
            onSelect={(opt) => {
              setSelectedDistrict(opt.id);
              updateUrl(selectedType, opt.id, null);
            }}
          />
        </section>
      )}

      {/* STEP 3: Place (Village / Ward) */}
      {step === 3 && (
        <section aria-labelledby="q3-heading" className="space-y-5">
          <h1 id="q3-heading" className="text-[26px] sm:text-[32px] font-bold text-text leading-tight mb-2">
            {selectedType === "gram_panchayat" ? t("flow.q3.village") : t("flow.q3.ward")}
          </h1>

          {/* If unknown, ask Village or Town first */}
          {selectedType === "unknown" && !unknownChoice && (
            <div className="space-y-3 mb-4">
              <h3 className="font-semibold text-[18px] text-text">{t("flow.villageOrTown")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUnknownChoice("village")}
                  className="min-h-btn px-4 py-3 rounded-btn border-2 border-border font-bold text-[16px] hover:border-primary hover:bg-primary/5"
                >
                  {t("flow.village")}
                </button>
                <button
                  type="button"
                  onClick={() => setUnknownChoice("town")}
                  className="min-h-btn px-4 py-3 rounded-btn border-2 border-border font-bold text-[16px] hover:border-primary hover:bg-primary/5"
                >
                  {t("flow.town")}
                </button>
              </div>
            </div>
          )}

          {loadingPlaces ? (
            <div className="py-8 text-center text-muted font-medium">
              {t("common.loading")}
            </div>
          ) : (
            <SearchSelect
              label={
                selectedType === "gram_panchayat" || unknownChoice === "village"
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
          )}
        </section>
      )}

      {/* STEP 4: Results "Your officers" */}
      {step === 4 && resolution && (
        <section aria-labelledby="results-heading" className="space-y-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-muted hover:text-text font-medium text-[15px] rounded-btn border border-border hover:bg-surface"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>{t("flow.back")}</span>
            </button>
            <span className="text-[14px] font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
              {resolution.place
                ? getLocalized(resolution.place, "name", lang)
                : selectedDistrict}
            </span>
          </div>

          <h1 id="results-heading" className="text-[28px] sm:text-[34px] font-bold text-text leading-tight">
            {t("results.title")}
          </h1>

          {/* Place Summary Header */}
          {resolution.place && (
            <div className="p-4 rounded-card bg-surface border border-border text-[15px] sm:text-[16px] text-text font-medium">
              📍 {getLocalized(resolution.place, "name", lang)}
              {resolution.place.gp_id && ` · GP: ${resolution.place.gp_id}`}
              {resolution.place.block_id && ` · Block: ${resolution.place.block_id}`}
              {resolution.place.tehsil_id && ` · Tehsil: ${resolution.place.tehsil_id}`}
              {selectedDistrict && ` · District: ${selectedDistrict}`}
            </div>
          )}

          {/* Coverage Gap Warning if block data missing */}
          {resolution.hasCoverageGap && <CoverageBanner />}

          {/* Cantonment / Authority Area Notice */}
          {resolution.isCantonmentOrOther && (
            <div className="p-5 rounded-card bg-blue-50 border-2 border-blue-200 text-blue-950 mb-6">
              <h3 className="font-bold text-[18px] text-blue-900 mb-1">
                {t("results.cantonmentTitle")}
              </h3>
              <p className="text-[15px] leading-relaxed text-blue-800">
                {t("results.cantonmentDesc")}
              </p>
            </div>
          )}

          {/* Officer Cards List */}
          <div className="space-y-4" aria-live="polite">
            {resolution.officers.map((item) => (
              <OfficerCard key={`${item.office.id}-${item.resolvedRole}`} item={item} />
            ))}

            {/* State Helpline & Jansunwai Card */}
            <article className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-card shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded text-[12px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900">
                  {t("results.stateOfficeTitle")}
                </span>
              </div>
              <h3 className="font-bold text-[20px] sm:text-[22px] text-white">
                {t("helpline.bar")}
              </h3>
              <p className="text-[14px] sm:text-[15px] text-slate-300 mt-1 mb-4 leading-relaxed">
                {t("results.stateOfficeDesc")}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`tel:${resolution.stateHelpline.number}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-btn transition-colors"
                >
                  <span>{t("helpline.call")}</span>
                </a>
                <a
                  href={resolution.stateHelpline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-btn transition-colors text-[15px]"
                >
                  <span>{t("results.jansunwaiLinkText")}</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </article>
          </div>

          {/* NEXT STEPS ROW */}
          <div className="mt-8 pt-6 border-t-2 border-border">
            <h3 className="font-bold text-[20px] text-text mb-4">
              {t("results.nextStepTitle")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href={`/issue/street-light/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(selectedPlace || "")}`}
                className="p-4 rounded-btn border-2 border-primary bg-primary/5 hover:bg-primary/10 text-primary font-bold text-center text-[15px] transition-colors"
              >
                {t("results.ladderBtn")}
              </Link>
              <Link
                href={`/letter/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(selectedPlace || "")}`}
                className="p-4 rounded-btn border-2 border-border hover:border-primary hover:bg-surface text-text font-bold text-center text-[15px] transition-colors"
              >
                {t("results.letterBtn")}
              </Link>
              <Link
                href={`/rti/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(selectedPlace || "")}`}
                className="p-4 rounded-btn border-2 border-border hover:border-primary hover:bg-surface text-text font-bold text-center text-[15px] transition-colors"
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
