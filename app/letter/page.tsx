"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { useT, useLang, getLocalized, formatDate } from "@/lib/i18n";
import { DistrictData, DistrictIndexEntry, Place, PincodeMap, IssueSlug } from "@/lib/types";
import { loadDistrictData, loadDistrictsIndex, loadPlacesData, loadPincodes } from "@/lib/data";
import { usePincodeLookup } from "@/lib/usePincodeLookup";
import { resolveOfficers } from "@/lib/resolver";
import { getPrimaryOfficerForIssue } from "@/lib/issue-routing";
import {
  formatPlaceBlockAndTehsil,
  formatPlaceLocalBody,
  formatPlaceSublabel,
} from "@/lib/place-display";
import { readSavedArea } from "@/lib/saved-area";
import SearchSelect, { SearchOption } from "@/components/SearchSelect";
import PrintSheet from "@/components/PrintSheet";

const ISSUES_LIST: { slug: IssueSlug; labelKey: string }[] = [
  { slug: "street-light", labelKey: "issue.street-light" },
  { slug: "drain", labelKey: "issue.drain" },
  { slug: "road", labelKey: "issue.road" },
  { slug: "handpump-water", labelKey: "issue.handpump-water" },
  { slug: "mgnrega", labelKey: "issue.mgnrega" },
  { slug: "garbage", labelKey: "issue.garbage" },
];

function LetterContent() {
  const t = useT();
  const { lang } = useLang();
  const searchParams = useSearchParams();

  const districtParam = searchParams.get("district") || "";
  const placeParam = searchParams.get("place") || "";
  const pincodeParam = searchParams.get("pincode") || "";
  const issueParam = searchParams.get("issue") || "street-light";
  const officerParam = searchParams.get("officer") || "";

  const [applicantName, setApplicantName] = useState("");
  const [mobile, setMobile] = useState("");
  const [villageOrWard, setVillageOrWard] = useState("");
  const [localBody, setLocalBody] = useState("");
  const [blockOrTehsil, setBlockOrTehsil] = useState("");
  const [district, setDistrict] = useState(districtParam);
  const [issue, setIssue] = useState<IssueSlug>(
    (issueParam as IssueSlug) || "street-light"
  );
  const [locationDetails, setLocationDetails] = useState("");
  const [dateFirstNoticed, setDateFirstNoticed] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [earlierComplaint, setEarlierComplaint] = useState("");
  const [addressedTo, setAddressedTo] = useState(officerParam);
  const [manualOfficerEdit, setManualOfficerEdit] = useState(false);
  const [selectedCcIds, setSelectedCcIds] = useState<string[]>([]);

  const [pinInput, setPinInput] = useState(pincodeParam);
  const [selectedDistId, setSelectedDistId] = useState(districtParam);
  const [selectedPlaceId, setSelectedPlaceId] = useState(placeParam);
  const [districtsIndex, setDistrictsIndex] = useState<DistrictIndexEntry[]>([]);
  const [pincodesMap, setPincodesMap] = useState<PincodeMap>({});
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [copied, setCopied] = useState(false);

  const pincodesLoadedRef = useRef(false);
  const lastAutoPinRef = useRef<string | null>(null);

  const ensurePincodesLoaded = useCallback(() => {
    if (pincodesLoadedRef.current) return;
    pincodesLoadedRef.current = true;
    loadPincodes().then(setPincodesMap);
  }, []);

  const pinState = usePincodeLookup(pinInput, pincodesMap);

  useEffect(() => {
    loadDistrictsIndex().then(setDistrictsIndex);
    if (pincodeParam && pincodeParam.replace(/\D/g, "").length >= 3) {
      ensurePincodesLoaded();
    }
    if (!districtParam && !placeParam && !pincodeParam) {
      const saved = readSavedArea();
      if (saved) {
        setSelectedDistId(saved.districtId);
        setSelectedPlaceId(saved.placeId === "district-hq" ? "" : saved.placeId);
        if (saved.pincode) {
          setPinInput(saved.pincode);
          ensurePincodesLoaded();
        }
      }
    }
  }, [districtParam, placeParam, pincodeParam, ensurePincodesLoaded]);

  // PIN auto-detect district once per 6-digit PIN entry
  useEffect(() => {
    if (pinInput.length !== 6) {
      lastAutoPinRef.current = null;
      return;
    }
    if (pinState.matches.length === 1 && lastAutoPinRef.current !== pinInput) {
      lastAutoPinRef.current = pinInput;
      const matched = pinState.matches[0].district_id;
      if (!selectedDistId || selectedDistId !== matched) {
        setSelectedDistId(matched);
        setSelectedPlaceId("");
        setManualOfficerEdit(false);
      }
    }
  }, [pinInput, pinState.matches, selectedDistId]);

  // Load district & places data cleanly only when selectedDistId changes (never resetting CC on lang toggle)
  useEffect(() => {
    setSelectedCcIds([]);
    if (!selectedDistId) {
      setDistrictData(null);
      setPlaces([]);
      return;
    }
    Promise.all([
      loadDistrictData(selectedDistId),
      loadPlacesData(selectedDistId),
    ]).then(([d, p]) => {
      setDistrictData(d);
      setPlaces(p);
    });
  }, [selectedDistId]);

  useEffect(() => {
    if (!selectedDistId) return;
    const meta = districtsIndex.find((entry) => entry.id === selectedDistId);
    setDistrict(meta ? getLocalized(meta, "name", lang) : selectedDistId);
  }, [selectedDistId, districtsIndex, lang]);

  const districtOptions: SearchOption[] = useMemo(
    () =>
      districtsIndex.map((d) => ({
        id: d.id,
        label: getLocalized(d, "name", lang),
        sublabel: t("directory.division", { division: getLocalized(d, "division", lang) }),
        searchValue: `${d.name_en} ${d.name_hi}`,
      })),
    [districtsIndex, lang, t]
  );

  const placeOptions: SearchOption[] = useMemo(() => {
    const scoped =
      pinInput.length === 6 && places.some((p) => p.pincodes?.includes(pinInput))
        ? places.filter((p) => p.pincodes?.includes(pinInput))
        : places;
    return scoped.map((p) => ({
      id: p.id,
      label: getLocalized(p, "name", lang),
      sublabel: formatPlaceSublabel(p, lang),
      searchValue: `${p.name_en} ${p.name_hi} ${p.block_name_en || ""} ${p.block_name_hi || ""} ${p.block_id || ""} ${p.gp_id || ""} ${p.pincodes?.join(" ") || ""}`,
    }));
  }, [places, pinInput, lang]);

  // Prefill human-readable location fields + auto-resolve addressedTo cleanly across issue/place/lang changes
  useEffect(() => {
    if (selectedPlaceId && places.length > 0) {
      const pl = places.find((p) => p.id === selectedPlaceId);
      if (pl) {
        setVillageOrWard(getLocalized(pl, "name", lang));
        setLocalBody(formatPlaceLocalBody(pl, districtData, lang));
        setBlockOrTehsil(formatPlaceBlockAndTehsil(pl, districtData, lang));
        if (districtData && !manualOfficerEdit) {
          const res = resolveOfficers(
            pl.local_body_type,
            selectedDistId,
            pl.id,
            districtData,
            places
          );
          const primary = getPrimaryOfficerForIssue(issue, res);
          if (primary) {
            setAddressedTo(getLocalized(primary.office, "office_name", lang));
          }
        }
        return;
      }
    }

    if (districtData?.offices && districtData.offices.length > 0 && !manualOfficerEdit) {
      const matchedFromParam = officerParam
        ? districtData.offices.find(
            (o) => o.office_name_en === officerParam || o.office_name_hi === officerParam
          )
        : undefined;
      const defaultOff =
        matchedFromParam ||
        districtData.offices.find((o) => o.role === "bdo") ||
        districtData.offices.find((o) => o.role === "eo") ||
        districtData.offices.find((o) => o.role === "dm") ||
        districtData.offices[0];
      if (defaultOff) {
        setAddressedTo(getLocalized(defaultOff, "office_name", lang));
      }
    }
  }, [places, selectedPlaceId, districtData, selectedDistId, issue, lang, manualOfficerEdit, officerParam]);

  // Escalation CC candidates (SDM matching tehsil if known, CDO, DM) that aren't the primary recipient
  const ccCandidates = useMemo(() => {
    if (!districtData?.offices) return [];
    const pl = selectedPlaceId ? places.find((p) => p.id === selectedPlaceId) : null;
    const sdm =
      (pl?.tehsil_id
        ? districtData.offices.find((o) => o.role === "sdm" && o.covers.includes(pl.tehsil_id!))
        : undefined) || districtData.offices.find((o) => o.role === "sdm");
    const cdo = districtData.offices.find((o) => o.role === "cdo");
    const dm = districtData.offices.find((o) => o.role === "dm");
    return [sdm, cdo, dm].filter((o): o is NonNullable<typeof o> => {
      if (!o) return false;
      const title = getLocalized(o, "office_name", lang);
      return title !== addressedTo;
    });
  }, [districtData, places, selectedPlaceId, addressedTo, lang]);

  const selectedCcNames = useMemo(() => {
    return ccCandidates
      .filter((o) => selectedCcIds.includes(o.id))
      .map((o) => getLocalized(o, "office_name", lang));
  }, [ccCandidates, selectedCcIds, lang]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formattedDate = formatDate(dateFirstNoticed, lang);
  const issueName = t(`issue.${issue}`);
  const fullLocation = [villageOrWard, localBody && localBody !== villageOrWard ? localBody : "", blockOrTehsil, district]
    .filter(Boolean)
    .join(", ");

  const todayDisplay = formatDate(new Date().toISOString().split("T")[0], lang);

  const handleCopyText = async () => {
    const lines = [
      t("letter.template.to"),
      addressedTo || `[${t("letter.selectOfficer")}]`,
      `${blockOrTehsil ? `${blockOrTehsil}, ` : ""}${district || "Uttar Pradesh"}`,
      "",
      t("letter.template.subject", { issue: issueName }),
      "",
      t("letter.template.sir"),
      "",
      t("letter.template.p1", {
        location: fullLocation || `[${t("letter.placeLabel")}]`,
        issue: issueName,
        date: formattedDate || `[${t("letter.dateLabel")}]`,
      }),
      locationDetails ? t("letter.template.p2", { locationDetails }) : "",
      earlierComplaint ? t("letter.template.prior", { priorRef: earlierComplaint }) : "",
      t("letter.template.p3"),
      t("letter.template.p4"),
      "",
      `${t("letter.template.closing")} ${applicantName || ""}${mobile ? ` (${mobile})` : ""}`,
      ...(selectedCcNames.length > 0
        ? ["", t("letter.ccHeading"), ...selectedCcNames.map((name, idx) => `${idx + 1}. ${name}, ${district}`)]
        : []),
    ].filter((l) => l !== "");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const toggleCc = (id: string) => {
    setSelectedCcIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-[840px] mx-auto space-y-8">
      {/* Page Title */}
      <div className="no-print space-y-2 border-b border-border pb-5">
        <h1 className="font-editorial text-[30px] sm:text-[36px] font-bold text-text">
          {t("letter.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed">
          {t("letter.subtitle")}
        </p>
      </div>

      {/* FORM INPUTS */}
      <section aria-label="Letter Form" className="no-print space-y-5">
        {/* Built-in Quick PIN + Area Picker */}
        <div className="p-4 rounded-[6px] bg-surface border border-border space-y-3 overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label htmlFor="letter-pin-input" className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted mb-2">
                {t("letter.pinQuickLookup")}
              </label>
              <input
                id="letter-pin-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onFocus={ensurePincodesLoaded}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                  if (clean.length >= 1) ensurePincodesLoaded();
                  if (clean.length < 6) lastAutoPinRef.current = null;
                  setPinInput(clean);
                }}
                placeholder="226001"
                className="w-full min-h-btn px-3.5 py-2.5 bg-bg text-text text-[16px] tabular-nums border border-borderStrong rounded-[4px] focus:border-[#154273] focus-visible:outline-none"
              />
            </div>

            <SearchSelect
              label={t("flow.selectDistrict")}
              options={districtOptions}
              value={selectedDistId || null}
              onSelect={(opt) => {
                if (pinInput && !pinState.matches.some((m) => m.district_id === opt.id)) {
                  setPinInput("");
                  lastAutoPinRef.current = null;
                }
                setSelectedDistId(opt.id);
                setSelectedPlaceId("");
                setAddressedTo("");
                setManualOfficerEdit(false);
              }}
            />

            {selectedDistId && places.length > 0 && (
              <SearchSelect
                label={t("letter.pickPlaceOptional")}
                options={placeOptions}
                value={selectedPlaceId || null}
                onSelect={(opt) => {
                  setManualOfficerEdit(false);
                  setSelectedPlaceId(opt.id);
                }}
              />
            )}
          </div>

          {pinState.matches.length > 1 && (
            <Banner status="info" container="card" title={t("flow.pincodeMulti")}>
              <div className="flex flex-wrap gap-2 pt-1">
                {pinState.matches.map((m) => {
                  const meta = districtsIndex.find((d) => d.id === m.district_id);
                  return (
                    <Button
                      key={m.district_id}
                      type="button"
                      size="sm"
                      variant={selectedDistId === m.district_id ? "primary" : "secondary"}
                      label={meta ? getLocalized(meta, "name", lang) : m.district_id}
                      onClick={() => {
                        setSelectedDistId(m.district_id);
                        setSelectedPlaceId("");
                        setManualOfficerEdit(false);
                      }}
                    />
                  );
                })}
              </div>
            </Banner>
          )}
        </div>

        <Card padding={5} variant="default" elevation="none">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.applicantName")} *
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Ram Prasad"
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.mobile")} *
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.villageOrWard")} *
                </label>
                <input
                  type="text"
                  value={villageOrWard}
                  onChange={(e) => setVillageOrWard(e.target.value)}
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.blockOrTehsil")} *
                </label>
                <input
                  type="text"
                  value={blockOrTehsil}
                  onChange={(e) => setBlockOrTehsil(e.target.value)}
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.district")} *
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.issue")}
                </label>
                <select
                  value={issue}
                  onChange={(e) => setIssue(e.target.value as IssueSlug)}
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                >
                  {ISSUES_LIST.map((it) => (
                    <option key={it.slug} value={it.slug}>
                      {t(it.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.addressedTo")}
                </label>
                {districtData?.offices ? (
                  <select
                    value={addressedTo}
                    onChange={(e) => {
                      setManualOfficerEdit(true);
                      setAddressedTo(e.target.value);
                    }}
                    className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                  >
                    {addressedTo &&
                      !districtData.offices.some(
                        (off) => getLocalized(off, "office_name", lang) === addressedTo
                      ) && <option value={addressedTo}>{addressedTo}</option>}
                    {districtData.offices.map((off) => {
                      const offName = getLocalized(off, "office_name", lang);
                      return (
                        <option key={off.id} value={offName}>
                          {offName} ({t(`role.${off.role}`)})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={addressedTo}
                    onChange={(e) => {
                      setManualOfficerEdit(true);
                      setAddressedTo(e.target.value);
                    }}
                    placeholder="e.g. Block Development Officer"
                    className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Optional Escalation CC Checkboxes */}
            {ccCandidates.length > 0 && (
              <div>
                <span className="block text-label font-semibold text-text mb-1.5">
                  {t("letter.ccLabel")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {ccCandidates.map((off) => {
                    const checked = selectedCcIds.includes(off.id);
                    const offName = getLocalized(off, "office_name", lang);
                    return (
                      <label
                        key={off.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] border text-[13px] font-medium cursor-pointer transition-colors ${
                          checked
                            ? "bg-[#EBF1F6] border-[#154273] text-[#154273]"
                            : "bg-bg border-border text-text hover:border-[#154273]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCc(off.id)}
                          className="accent-[#154273]"
                        />
                        <span>{offName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-label font-semibold text-text mb-1">
                {t("letter.locationDetails")}
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="e.g. Near Primary School, Pole No. 4"
                className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.dateFirstNoticed")}
                </label>
                <input
                  type="date"
                  value={dateFirstNoticed}
                  onChange={(e) => setDateFirstNoticed(e.target.value)}
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("letter.earlierComplaint")}
                </label>
                <input
                  type="text"
                  value={earlierComplaint}
                  onChange={(e) => setEarlierComplaint(e.target.value)}
                  placeholder="e.g. IGRS #1076-2026-X"
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <a
                href="https://jansunwai.up.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
              >
                {t("results.jansunwaiLinkText")} ↗
              </a>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  label={copied ? t("common.copied") : t("common.copyText")}
                  onClick={handleCopyText}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  label={t("letter.print")}
                  onClick={handlePrint}
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* RENDERED PRINT SHEET */}
      <PrintSheet>
        <article className="space-y-4">
          <div>
            <p className="font-bold text-[16pt] text-black">
              {t("letter.template.to")}
            </p>
            <p className="font-semibold text-[13pt] text-black pl-4">
              {addressedTo || `[${t("letter.selectOfficer")}]`}
            </p>
            <p className="text-[12pt] text-black pl-4">
              {blockOrTehsil ? `${blockOrTehsil}, ` : ""}
              {district || "Uttar Pradesh"}
            </p>
          </div>

          <div className="font-bold text-[13pt] text-black border-y-2 border-black py-2 my-3">
            {t("letter.template.subject", { issue: issueName })}
          </div>

          <p className="font-semibold text-[12pt]">{t("letter.template.sir")}</p>

          <p className="text-[12pt] leading-relaxed">
            {t("letter.template.p1", {
              location: fullLocation || `[${t("letter.placeLabel")}]`,
              issue: issueName,
              date: formattedDate || `[${t("letter.dateLabel")}]`,
            })}
          </p>

          {locationDetails && (
            <p className="text-[12pt] leading-relaxed">
              {t("letter.template.p2", { locationDetails })}
            </p>
          )}

          {earlierComplaint && (
            <p className="text-[12pt] leading-relaxed">
              {t("letter.template.prior", { priorRef: earlierComplaint })}
            </p>
          )}

          <p className="text-[12pt] leading-relaxed">
            {t("letter.template.p3")}
          </p>

          <p className="text-[12pt] font-semibold leading-relaxed">
            {t("letter.template.p4")}
          </p>

          <div className="pt-8 flex justify-between items-end">
            <div>
              <p className="text-[11pt]">
                {t("letter.dateLabel")}: {todayDisplay}
              </p>
              <p className="text-[11pt]">
                {t("letter.placeLabel")}: {district || "Uttar Pradesh"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12pt] mb-12">{t("letter.template.closing")}</p>
              <p className="font-bold text-[12pt]">{applicantName || "____________________"}</p>
              <p className="text-[11pt]">
                {t("letter.mobileShort")}: {mobile || "____________________"}
              </p>
            </div>
          </div>

          {selectedCcNames.length > 0 && (
            <div className="pt-4 border-t border-black/40 text-[11pt] space-y-1">
              <p className="font-bold">{t("letter.ccHeading")}</p>
              {selectedCcNames.map((name, idx) => (
                <p key={name} className="pl-3">
                  {idx + 1}. {name}
                  {district ? `, ${district}` : ""}
                </p>
              ))}
            </div>
          )}
        </article>

        {/* Localized Perforated Divider & Acknowledgment Copy */}
        <div className="my-8 border-b-2 border-dashed border-black relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-[10pt] uppercase font-bold tracking-wider whitespace-nowrap">
            ✂️ {t("letter.receiptCopy")} ({t("letter.counterfoilDivider")})
          </span>
        </div>

        <section aria-label="Acknowledgment Copy" className="pt-2 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-[14pt] text-black">
              {t("letter.receiptCopy")}
            </h4>
            <span className="text-[11pt] font-semibold">
              {t("letter.diaryNoLabel")}: ____________
            </span>
          </div>

          <p className="text-[11pt] leading-normal">
            {t("letter.receivedBy")}: {addressedTo || t("letter.selectOfficer")}
          </p>
          <p className="text-[11pt] leading-normal">
            {t("letter.applicantShort")}: <strong>{applicantName || "__________"}</strong> |{" "}
            {t("letter.mobileShort")}: <strong>{mobile || "__________"}</strong>
          </p>
          <p className="text-[11pt] leading-normal">
            {t("letter.locationIssueLabel")}: {fullLocation} — {issueName}
          </p>

          <div className="pt-8 flex justify-between items-end text-[11pt]">
            <div>
              <p>{t("letter.receiptDate")}: ______________</p>
            </div>
            <div className="text-right">
              <p className="mb-6">{t("letter.officeSeal")}</p>
              <p>{t("letter.officerSignature")}: ______________</p>
            </div>
          </div>
        </section>
      </PrintSheet>
    </div>
  );
}

export default function LetterPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Loading...</div>}>
      <LetterContent />
    </Suspense>
  );
}
