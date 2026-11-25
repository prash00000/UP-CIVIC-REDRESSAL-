"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
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
} from "@/lib/data";
import { resolveOfficers } from "@/lib/resolver";
import { usePincodeLookup } from "@/lib/usePincodeLookup";
import {
  ISSUE_LIST,
  getIssueAreaSteps,
  getPrimaryOfficerForIssue,
  getRelevantPortals,
} from "@/lib/issue-routing";
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

  const [selectedDistrict, setSelectedDistrict] = useState<string>(districtParam);
  const [selectedPlace, setSelectedPlace] = useState<string>(placeParam);
  const [pinInput, setPinInput] = useState<string>(pincodeParam);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilterKind>("all");
  const [editingArea, setEditingArea] = useState<boolean>(!districtParam || !placeParam);

  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingArea, setLoadingArea] = useState<boolean>(false);

  const pinState = usePincodeLookup(pinInput, pincodesMap);

  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    loadPincodes().then(setPincodesMap);
    loadStateData().then(setStateData);
  }, []);

  useEffect(() => {
    if (!initialIssue) {
      fetch(`/data/issues/${slug}.json`)
        .then((r) => r.json())
        .then(setIssue)
        .catch(console.error);
    }
  }, [slug, initialIssue]);

  useEffect(() => {
    setSelectedDistrict(districtParam);
    setSelectedPlace(placeParam);
    if (pincodeParam) setPinInput(pincodeParam);
    if (!districtParam || !placeParam) {
      setEditingArea(true);
    }
  }, [districtParam, placeParam, pincodeParam]);

  useEffect(() => {
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

  const syncUrl = (nextDist: string, nextPlace: string, nextPin = pinInput) => {
    const params = new URLSearchParams();
    if (nextDist) params.set("district", nextDist);
    if (nextPlace) params.set("place", nextPlace);
    if (nextPin && nextPin.length === 6) params.set("pincode", nextPin);
    const qs = params.toString();
    router.replace(qs ? `/issue/${slug}/?${qs}` : `/issue/${slug}/`);
  };

  // Auto-select district from single-match 6-digit PIN if no district yet chosen
  useEffect(() => {
    if (pinInput.length === 6 && pinState.matches.length === 1 && !selectedDistrict) {
      const matchedDist = pinState.matches[0].district_id;
      setSelectedDistrict(matchedDist);
      syncUrl(matchedDist, "", pinInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinInput, pinState.matches]);

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

  const placeOptions: SearchOption[] = useMemo(() => {
    const filtered = places.filter((p) => {
      if (placeFilter === "all") return true;
      if (placeFilter === "block") return p.id.startsWith("block-");
      if (placeFilter === "village") return p.type === "village" && !p.id.startsWith("block-");
      return p.type === "ward";
    });
    return filtered.map((p) => ({
      id: p.id,
      label: getLocalized(p, "name", lang),
      sublabel:
        p.type === "village"
          ? `${p.block_id ? `Block: ${p.block_id}` : ""}${p.pincodes?.[0] ? ` · PIN ${p.pincodes[0]}` : ""}`
          : `${p.ulb_id || p.tehsil_id}${p.pincodes?.[0] ? ` · PIN ${p.pincodes[0]}` : ""}`,
      searchValue: `${p.name_en} ${p.name_hi} ${p.block_id || ""} ${p.gp_id || ""} ${p.pincodes?.join(" ") || ""}`,
    }));
  }, [places, placeFilter, lang]);

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
      stateData || undefined
    );
  }, [selectedDistrict, districtData, selectedPlace, currentPlace, places, stateData]);

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
  const letterQs = `district=${encodeURIComponent(selectedDistrict || "")}&place=${encodeURIComponent(
    selectedPlace === "district-hq" ? "" : selectedPlace || ""
  )}&issue=${encodeURIComponent(slug)}&officer=${encodeURIComponent(letterOfficerParam)}`;

  const sequenceStep = resolution ? 3 : selectedDistrict ? 2 : 2;

  return (
    <div className="max-w-form mx-auto space-y-6">
      <div className="space-y-3">
        <Breadcrumbs variant="supporting">
          <BreadcrumbItem href="/">{t("nav.home")}</BreadcrumbItem>
          <BreadcrumbItem isCurrent>{title}</BreadcrumbItem>
        </Breadcrumbs>

        {/* Step Sequence Indicator */}
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
          <span className="px-2.5 py-1 rounded-[4px] bg-[#EBF1F6] text-[#154273]">
            1. {t("issue.seqStep1")}
          </span>
          <span aria-hidden="true" className="text-muted">→</span>
          <span
            className={`px-2.5 py-1 rounded-[4px] ${
              selectedDistrict && selectedPlace
                ? "bg-[#EBF1F6] text-[#154273]"
                : "bg-[#154273] text-white"
            }`}
          >
            2. {t("issue.seqStep2")}
          </span>
          <span aria-hidden="true" className="text-muted">→</span>
          <span
            className={`px-2.5 py-1 rounded-[4px] ${
              sequenceStep === 3
                ? "bg-[#C84B16] text-white"
                : "bg-mutedSurface text-muted"
            }`}
          >
            3. {t("issue.seqStep3")}
          </span>
        </div>

        <h1 className="font-editorial text-[30px] sm:text-[38px] font-bold text-text leading-tight">
          {title}
        </h1>

        {/* Quick 6-Issue Switcher preserving selected area */}
        <div className="flex flex-wrap gap-1.5 pt-1" aria-label={t("issue.switchTopic")}>
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
                className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium border transition-colors ${
                  active
                    ? "bg-[#154273] text-white border-[#154273]"
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
        <div className="p-4 rounded-[6px] bg-[#EBF1F6] border border-[#154273]/30 flex flex-wrap items-center justify-between gap-3 text-[15px]">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#154273] block">
              ✓{" "}
              {currentPlace
                ? getLocalized(currentPlace, "name", lang)
                : t("flow.districtSupervisoryLabel")}{" "}
              · {getDistrictName(selectedDistrict)}
            </span>
            {currentPlace && (
              <span className="text-[13px] text-muted block">
                {currentPlace.block_id ? `Block: ${currentPlace.block_id} · ` : ""}
                {currentPlace.tehsil_id ? `Tehsil: ${currentPlace.tehsil_id}` : ""}
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
        <div className="p-5 sm:p-6 rounded-[6px] border border-border bg-surface overflow-visible">
          <div className="space-y-4">
            <div className="border-l-[3px] border-[#C84B16] pl-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C84B16]">
                {t("issue.seqStep2")}
              </p>
              <Heading level={2}>{t("issue.areaHeading")}</Heading>
              <Text as="p" type="supporting" color="secondary">
                {t("issue.areaSub")}
              </Text>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Quick 6-digit PIN */}
              <div className="space-y-2">
                <label
                  htmlFor="issue-pin-input"
                  className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted"
                >
                  {t("flow.quickPincode")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="issue-pin-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t("flow.pincodePlaceholder")}
                    className="flex-1 min-h-btn px-3.5 py-2 bg-bg text-text text-[16px] tabular-nums border border-borderStrong rounded-[4px] focus:border-[#154273] focus-visible:outline-none"
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
                  setSelectedDistrict(opt.id);
                  setSelectedPlace("");
                  syncUrl(opt.id, "", pinInput);
                }}
              />
            </div>

            {/* Village / Block / Town Picker once District is chosen */}
            {selectedDistrict && (
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">
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
                            : "bg-bg text-muted border-border hover:border-[#154273]"
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
                        )}`}
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
                  href={`/find/?issue=${encodeURIComponent(slug)}`}
                  className="font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                >
                  {t("issue.openGuidedFinder")} →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MGNREGA urban notice if urban ULB chosen */}
      {issueStepsData?.isRuralOnlyNotice && (
        <Banner
          status="info"
          container="card"
          title={t("issue.mgnregaRuralOnly")}
        />
      )}

      {/* STEP 3 ACTION PANEL: Direct Contact + Official Portal + Letter/RTI */}
      {resolution && primaryOfficer && (
        <Card padding={5} variant="default" elevation="none">
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

            <div className="p-4 rounded-[6px] bg-[#EBF1F6]/70 border border-[#154273]/25 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[18px] text-text leading-snug">
                    {getLocalized(primaryOfficer.office, "office_name", lang)}
                  </h3>
                  {getLocalized(primaryOfficer.office, "officer_name", lang) && (
                    <p className="text-[14px] text-muted">
                      {getLocalized(primaryOfficer.office, "officer_name", lang)}
                    </p>
                  )}
                </div>
                {primaryPhone && <VerifiedBadge phone={primaryPhone} />}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {primaryPhone ? (
                  <CallButton number={primaryPhone.number} />
                ) : primaryFallbackPhone ? (
                  <CallButton number={primaryFallbackPhone.number} />
                ) : null}

                <Link
                  href={`/letter/?${letterQs}`}
                  className="min-h-btn inline-flex items-center justify-center px-5 py-2.5 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[4px] transition-colors text-[15px]"
                >
                  {t("issue.writeComplaintBtn")} →
                </Link>

                <Link
                  href={`/rti/?${letterQs}`}
                  className="min-h-btn inline-flex items-center justify-center px-4 py-2.5 bg-surface hover:bg-bg border border-borderStrong text-text font-semibold rounded-[4px] transition-colors text-[15px]"
                >
                  {t("results.rtiBtn")}
                </Link>
              </div>
            </div>

            {/* Online Portals & Helplines matched to this issue & area */}
            <div className="p-4 rounded-[6px] bg-[#154273] text-white space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F39C72]">
                {t("issue.onlineHelplineLabel")}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`tel:${stateData?.cm_helpline?.number || "1076"}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C84B16] hover:bg-[#AD3E0F] text-white font-semibold rounded-[4px] text-[14px] tabular-nums"
                >
                  {t("helpline.call")}
                </a>
                <a
                  href={stateData?.jansunwai?.url || "https://jansunwai.up.nic.in"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-white/30 hover:bg-white/10 text-white font-medium rounded-[4px] text-[14px]"
                >
                  <span>{t("results.jansunwaiLinkText")}</span>
                  <span aria-hidden="true">↗</span>
                </a>
                {relevantPortals.map((portal) => (
                  <React.Fragment key={portal.id}>
                    {portal.helpline && (
                      <a
                        href={`tel:${portal.helpline.replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-[4px] text-[14px] tabular-nums"
                      >
                        {t("results.call")} {portal.helpline}
                      </a>
                    )}
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/30 hover:bg-white/10 text-white font-medium rounded-[4px] text-[14px]"
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
      <Card padding={5} variant="default" elevation="none">
        <section aria-labelledby="ladder-heading">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h2 id="ladder-heading" className="font-editorial text-[22px] sm:text-[26px] font-bold text-text">
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
            <Text as="p" type="supporting" color="secondary">
              {t("home.sub")}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/letter/?${letterQs}`}
              className="flex-1 sm:flex-none text-center min-h-btn inline-flex items-center justify-center px-5 py-2.5 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[4px] transition-colors text-[15px]"
            >
              {t("letter.title")}
            </Link>
            <Link
              href={`/rti/?${letterQs}`}
              className="flex-1 sm:flex-none text-center min-h-btn inline-flex items-center justify-center px-5 py-2.5 bg-surface hover:bg-bg border border-borderStrong text-text font-semibold rounded-[4px] transition-colors text-[15px]"
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
