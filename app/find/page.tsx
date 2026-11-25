"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
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

  const typeParam = searchParams.get("type") as LocalBodyType | "unknown" | "other" | null;
  const districtParam = searchParams.get("district");
  const placeParam = searchParams.get("place");
  const pincodeParam = searchParams.get("pincode");

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
  const [selectedPlace, setSelectedPlace] = useState<string | null>(placeParam);
  const [pincodeInput, setPincodeInput] = useState(pincodeParam || "");
  const [pincodeMatches, setPincodeMatches] = useState<{ district_id: string; tehsil_id?: string }[] | null>(null);
  const [pincodeNotFound, setPincodeNotFound] = useState(false);
  const [unknownChoice, setUnknownChoice] = useState<"village" | "town" | null>(null);

  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    loadPincodes().then(setPincodesMap);
    loadStateData().then(setStateInfo);
  }, []);

  useEffect(() => {
    setSelectedType(typeParam);
    setSelectedDistrict(districtParam);
    setSelectedPlace(placeParam);
  }, [typeParam, districtParam, placeParam]);

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
        <section aria-labelledby="q1-heading" className="space-y-5">
          <div>
            <h1 id="q1-heading" className="font-editorial text-[28px] sm:text-[34px] font-bold text-text leading-tight mb-2">
              {t("flow.q1")}
            </h1>
            <p className="text-[16px] text-muted leading-relaxed">
              {t("home.step1Desc")}
            </p>
          </div>

          <Card padding={4} variant="default" elevation="none">
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
                {pincodeMatches && pincodeMatches.length > 0 && selectedDistrict && (
                  <Badge
                    variant="success"
                    label={getLocalized(districts.find((d) => d.id === selectedDistrict), "name", lang)}
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
          </Card>

          <div className="space-y-2.5">
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

              {pincodeMatches && pincodeMatches.length === 1 && selectedDistrict && (
                <Banner
                  status="success"
                  container="card"
                  title={t("flow.pincodeDetected", {
                    district:
                      getLocalized(
                        districts.find((d) => d.id === selectedDistrict),
                        "name",
                        lang
                      ) || selectedDistrict,
                  })}
                />
              )}

              {pincodeMatches && pincodeMatches.length > 1 && (
                <Banner
                  status="info"
                  container="card"
                  collapsible={false}
                  title={t("flow.pincodeMulti")}
                >
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pincodeMatches.map((m) => {
                      const dEntry = districts.find((d) => d.id === m.district_id);
                      const dName = dEntry ? getLocalized(dEntry, "name", lang) : m.district_id;
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

              {pincodeNotFound && (
                <Banner status="warning" container="card" title={t("flow.pincodeNotFound")} />
              )}
            </div>
          </Card>

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
          <h1 id="q3-heading" className="font-editorial text-[28px] sm:text-[34px] font-bold text-text leading-tight">
            {selectedType === "gram_panchayat" ? t("flow.q3.village") : t("flow.q3.ward")}
          </h1>

          {selectedType === "unknown" && !unknownChoice && (
            <div className="space-y-3 mb-4">
              <h3 className="font-semibold text-[18px] text-text">{t("flow.villageOrTown")}</h3>
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
                  : selectedDistrict || ""
              }
            />
          </div>

          <h1 id="results-heading" className="font-editorial text-[30px] sm:text-[36px] font-bold text-text leading-tight">
            {t("results.title")}
          </h1>

          {resolution.place && (
            <div className="p-4 rounded-[6px] bg-surface border border-border border-l-4 border-l-[#154273] text-[15px] text-text font-medium">
              {getLocalized(resolution.place, "name", lang)}
              {resolution.place.gp_id && ` · GP: ${resolution.place.gp_id}`}
              {resolution.place.block_id && ` · Block: ${resolution.place.block_id}`}
              {resolution.place.tehsil_id && ` · Tehsil: ${resolution.place.tehsil_id}`}
              {selectedDistrict && ` · District: ${selectedDistrict}`}
            </div>
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
            </article>
          </div>

          <Divider />

          <div className="pt-2">
            <h3 className="font-editorial font-bold text-[22px] text-text mb-4">
              {t("results.nextStepTitle")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href={`/issue/street-light/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(selectedPlace || "")}`}
                className="p-4 rounded-[4px] border border-[#154273] bg-[#EBF1F6]/60 hover:bg-[#EBF1F6] text-[#154273] font-semibold text-center text-[15px] transition-colors"
              >
                {t("results.ladderBtn")}
              </Link>
              <Link
                href={`/letter/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(selectedPlace || "")}`}
                className="p-4 rounded-[4px] border border-borderStrong hover:border-[#154273] bg-surface text-text font-semibold text-center text-[15px] transition-colors"
              >
                {t("results.letterBtn")}
              </Link>
              <Link
                href={`/rti/?district=${encodeURIComponent(
                  selectedDistrict || ""
                )}&place=${encodeURIComponent(selectedPlace || "")}`}
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
