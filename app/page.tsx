"use client";

import React, { useState, useEffect, useCallback, useRef, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import { loadDistrictsIndex, loadPincodes } from "@/lib/data";
import { DistrictIndexEntry, PincodeMap } from "@/lib/types";
import { usePincodeLookup } from "@/lib/usePincodeLookup";
import { readSavedArea, clearSavedArea, SavedArea } from "@/lib/saved-area";

const SAMPLE_PINS = [
  { pin: "226001", labelEn: "Lucknow", labelHi: "लखनऊ" },
  { pin: "201301", labelEn: "Noida", labelHi: "नोएडा" },
  { pin: "222001", labelEn: "Jaunpur", labelHi: "जौनपुर" },
];

const ISSUES: {
  slug: string;
  titleKey: string;
  chipClass: string;
  icon: React.ReactNode;
}[] = [
  {
    slug: "street-light",
    titleKey: "issue.street-light",
    chipClass: "bg-[#FDF4E3] text-[#8A5300] border-[#F0D5A0]",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    ),
  },
  {
    slug: "drain",
    titleKey: "issue.drain",
    chipClass: "bg-[#EBF1F6] text-[#154273] border-[#C6D4E2]",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    slug: "road",
    titleKey: "issue.road",
    chipClass: "bg-[#FBEFE9] text-[#B3400F] border-[#EFC7B5]",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19L8 5" />
        <path d="M20 19L16 5" />
        <line x1="12" y1="6" x2="12" y2="9" />
        <line x1="12" y1="12" x2="12" y2="15" />
        <line x1="12" y1="18" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    slug: "handpump-water",
    titleKey: "issue.handpump-water",
    chipClass: "bg-[#E7F4F6] text-[#0D5C63] border-[#BBDDE3]",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 12h12" />
        <path d="M8 12v8" />
        <path d="M16 12v4a2 2 0 0 1-2 2h-1" />
        <path d="M12 12V6l4-2" />
      </svg>
    ),
  },
  {
    slug: "mgnrega",
    titleKey: "issue.mgnrega",
    chipClass: "bg-[#ECF3EE] text-[#245937] border-[#BBD8C4]",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="7" y1="9" x2="17" y2="9" />
        <line x1="7" y1="13" x2="17" y2="13" />
        <line x1="7" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
  {
    slug: "garbage",
    titleKey: "issue.garbage",
    chipClass: "bg-[#F0EFF6] text-[#4A3E72] border-[#D5D0E6]",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const pinInputId = useId();
  const [homePin, setHomePin] = useState("");
  const [districts, setDistricts] = useState<DistrictIndexEntry[]>([]);
  const [pincodesMap, setPincodesMap] = useState<PincodeMap>({});
  const pincodesLoadedRef = useRef(false);
  const [savedArea, setSavedArea] = useState<SavedArea | null>(null);

  const ensurePincodesLoaded = useCallback(() => {
    if (pincodesLoadedRef.current) return;
    pincodesLoadedRef.current = true;
    loadPincodes().then(setPincodesMap);
  }, []);

  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    setSavedArea(readSavedArea());
  }, []);

  const pinState = usePincodeLookup(homePin, pincodesMap);

  const getDistrictName = (id: string) => {
    const found = districts.find((d) => d.id === id);
    return found ? getLocalized(found, "name", lang) : id;
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = homePin.replace(/\D/g, "");
    if (clean.length !== 6) return;
    if (pinState.matches.length === 1) {
      router.push(
        `/find/?pincode=${clean}&district=${encodeURIComponent(
          pinState.matches[0].district_id
        )}`
      );
    } else {
      router.push(`/find/?pincode=${clean}`);
    }
  };

  return (
    <div className="space-y-12 md:space-y-16">
      {/* HERO: Clean 7 + 5 Asymmetric Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-1 md:pt-3">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF1F6] border border-[#C6D4E2]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#154273]" aria-hidden="true" />
            <span className="text-[12px] font-bold uppercase tracking-[0.07em] text-[#154273]">
              {t("home.eyebrow")}
            </span>
          </div>

          <h1 className="page-title text-text">
            {t("home.title")}
          </h1>

          <p className="text-[17px] sm:text-[18px] text-muted leading-relaxed max-w-[54ch]">
            {t("home.sub")}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Link
              href="/find/"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 bg-[#154273] hover:bg-[#0F3156] active:scale-[0.99] text-white text-[16px] font-semibold rounded-[8px] transition-all focus-visible:outline-primary shadow-[0_2px_6px_rgba(21,66,115,0.2)]"
            >
              <span>{t("home.cta")}</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/directory/"
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 border border-[#A8A295] hover:border-[#154273] hover:bg-[#FAF9F6] bg-surface text-text text-[16px] font-semibold rounded-[8px] transition-colors"
            >
              {t("nav.directory")}
            </Link>
          </div>

          <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-muted tabular-nums">
              {t("home.statsStrip")}
            </span>
          </div>

          {savedArea && (
            <div className="p-4 rounded-[12px] bg-[#EBF1F6] border border-[#154273]/30 flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#154273] block">
                  {t("saved.useSavedPrefix")}
                </span>
                <Link
                  href={`/find/?type=${encodeURIComponent(savedArea.localBodyType)}&district=${encodeURIComponent(
                    savedArea.districtId
                  )}&place=${encodeURIComponent(savedArea.placeId)}${
                    savedArea.pincode ? `&pincode=${encodeURIComponent(savedArea.pincode)}` : ""
                  }`}
                  className="font-semibold text-text hover:text-[#154273] underline underline-offset-4"
                >
                  {lang === "hi" ? savedArea.placeNameHi : savedArea.placeNameEn} ·{" "}
                  {lang === "hi" ? savedArea.districtNameHi : savedArea.districtNameEn}
                </Link>
              </div>
              <div className="flex items-center gap-3 text-[13px]">
                <Link
                  href={`/find/?district=${encodeURIComponent(savedArea.districtId)}&type=${encodeURIComponent(
                    savedArea.localBodyType
                  )}${savedArea.pincode ? `&pincode=${encodeURIComponent(savedArea.pincode)}` : ""}`}
                  className="font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                >
                  {t("flow.change")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearSavedArea();
                    setSavedArea(null);
                  }}
                  className="text-muted hover:text-danger underline underline-offset-4"
                >
                  {t("saved.clear")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Framed Quick PIN Lookup Panel */}
        <div className="lg:col-span-5">
          <Card padding={5} variant="default" elevation="low">
            <div className="space-y-4">
              <div className="border-l-[3px] border-[#C84B16] pl-3.5 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C84B16]">
                  {t("flow.quickPincode")}
                </p>
                <Heading level={3}>{t("home.pincodeCta")}</Heading>
              </div>

              <Text as="p" display="block" type="supporting" color="secondary">
                {t("home.pinHint")}
              </Text>

              <form onSubmit={handlePinSubmit} className="space-y-3">
                <label htmlFor={pinInputId} className="sr-only">
                  {t("flow.quickPincode")}
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id={pinInputId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    enterKeyHint="next"
                    maxLength={6}
                    value={homePin}
                    onFocus={ensurePincodesLoaded}
                    onChange={(e) => {
                      ensurePincodesLoaded();
                      setHomePin(e.target.value.replace(/\D/g, "").slice(0, 6));
                    }}
                    placeholder={t("flow.pincodePlaceholder")}
                    aria-label="Pincode search"
                    className="flex-1 min-h-[48px] px-3.5 py-2 text-[16px] font-medium tabular-nums border border-[#A8A295] rounded-[8px] bg-[#FAF9F6] focus:bg-surface focus:border-[#154273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154273]/25 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={homePin.length !== 6}
                    className="min-h-[48px] px-5 py-2 bg-[#154273] hover:bg-[#0F3156] disabled:opacity-45 disabled:cursor-not-allowed text-white font-semibold rounded-[8px] text-[15px] transition-colors whitespace-nowrap"
                  >
                    {t("flow.next")}
                  </button>
                </div>

                {/* Clickable Sample UP PIN Quick Chips */}
                {!homePin && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[12px]">
                    <span className="text-muted font-medium">
                      {lang === "hi" ? "उदाहरण:" : "Try:"}
                    </span>
                    {SAMPLE_PINS.map((s) => (
                      <button
                        key={s.pin}
                        type="button"
                        onClick={() => {
                          ensurePincodesLoaded();
                          setHomePin(s.pin);
                        }}
                        className="px-2 py-0.5 rounded-[6px] bg-[#F6F5F0] hover:bg-[#EBF1F6] border border-border text-text hover:border-[#154273] font-medium tabular-nums transition-colors"
                      >
                        {s.pin} · {lang === "hi" ? s.labelHi : s.labelEn}
                      </button>
                    ))}
                  </div>
                )}

                {pinState.matches.length === 1 && (
                  <Banner
                    status="success"
                    container="card"
                    collapsible={false}
                    title={t(
                      pinState.kind === "exact" || pinState.kind === "live"
                        ? "flow.pincodeDetected"
                        : "flow.pincodePrefixDetected",
                      { district: getDistrictName(pinState.matches[0].district_id) }
                    )}
                    description={
                      pinState.localitySummary
                        ? t("flow.pincodeAreaHint", { area: pinState.localitySummary })
                        : undefined
                    }
                  >
                    <div className="pt-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        label={`${t("flow.continueDistrict", { district: getDistrictName(pinState.matches[0].district_id) })} →`}
                        onClick={() =>
                          router.push(
                            `/find/?pincode=${homePin.replace(/\D/g, "")}&district=${encodeURIComponent(
                              pinState.matches[0].district_id
                            )}`
                          )
                        }
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
                      {pinState.matches.map((m) => (
                        <Button
                          key={m.district_id}
                          type="button"
                          size="sm"
                          variant="secondary"
                          label={getDistrictName(m.district_id)}
                          onClick={() =>
                            router.push(
                              `/find/?pincode=${homePin}&district=${encodeURIComponent(
                                m.district_id
                              )}`
                            )
                          }
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
                      pin: homePin,
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
              </form>
            </div>
          </Card>
        </div>
      </section>

      <Divider />

      {/* HOW IT WORKS: Clean 3-Step Visual Progression */}
      <section aria-labelledby="how-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2
            id="how-heading"
            className="text-[24px] sm:text-[28px] font-bold text-text tracking-[-0.02em]"
          >
            {t("home.howItWorks")}
          </h2>
        </div>

        <Card padding={0} variant="default" elevation="low">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { num: "01", titleKey: "home.step1Title", descKey: "home.step1Desc" },
              { num: "02", titleKey: "home.step2Title", descKey: "home.step2Desc" },
              { num: "03", titleKey: "home.step3Title", descKey: "home.step3Desc" },
            ].map((item) => (
              <div key={item.num} className="p-6 space-y-2.5">
                <div className="inline-flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#EBF1F6] text-[#154273] text-[13px] font-bold flex items-center justify-center tabular-nums">
                    {item.num}
                  </span>
                </div>
                <Heading level={3}>{t(item.titleKey)}</Heading>
                <Text as="p" display="block" type="body" color="secondary">
                  {t(item.descKey)}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ISSUE GRID: Distinct Colored Icon Chips for Instant Recognition */}
      <section aria-labelledby="issues-heading" className="space-y-6">
        <div className="max-w-[660px] space-y-1.5">
          <h2
            id="issues-heading"
            className="text-[24px] sm:text-[28px] font-bold text-text tracking-[-0.02em]"
          >
            {t("home.issuesTitle")}
          </h2>
          <Text as="p" display="block" type="body" color="secondary">
            {t("issue.subtitle")}
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ISSUES.map((issue) => {
            const cleanPin = homePin.replace(/\D/g, "");
            let issueHref = `/issue/${issue.slug}/`;
            if (cleanPin.length === 6 && pinState.matches.length === 1) {
              issueHref = `/issue/${issue.slug}/?district=${encodeURIComponent(
                pinState.matches[0].district_id
              )}&pincode=${cleanPin}`;
            } else if (cleanPin.length === 6) {
              issueHref = `/issue/${issue.slug}/?pincode=${cleanPin}`;
            } else if (savedArea) {
              issueHref = `/issue/${issue.slug}/?district=${encodeURIComponent(
                savedArea.districtId
              )}&place=${encodeURIComponent(
                savedArea.placeId === "district-hq" ? "" : savedArea.placeId
              )}${savedArea.pincode ? `&pincode=${encodeURIComponent(savedArea.pincode)}` : ""}`;
            }
            return (
              <Link
                key={issue.slug}
                href={issueHref}
                className="p-5 rounded-[12px] border border-border bg-surface civic-card-interactive flex items-start gap-4 group"
              >
                <div
                  className={`w-11 h-11 rounded-[10px] border flex items-center justify-center flex-shrink-0 ${issue.chipClass}`}
                >
                  {issue.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[16px] sm:text-[17px] text-text group-hover:text-[#154273] transition-colors leading-snug">
                    {t(issue.titleKey)}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#154273] mt-2.5">
                    <span>{t("home.issueActionBtn")}</span>
                    <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
