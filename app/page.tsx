"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import { loadDistrictsIndex, loadPincodes } from "@/lib/data";
import { DistrictIndexEntry, PincodeMap } from "@/lib/types";
import { resolvePincode } from "@/lib/pincode";

const ISSUES: { slug: string; titleKey: string; icon: React.ReactNode }[] = [
  {
    slug: "street-light",
    titleKey: "issue.street-light",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    ),
  },
  {
    slug: "drain",
    titleKey: "issue.drain",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    slug: "road",
    titleKey: "issue.road",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
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
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
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
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
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
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
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
  const [homePin, setHomePin] = useState("");
  const [districts, setDistricts] = useState<DistrictIndexEntry[]>([]);
  const [pincodesMap, setPincodesMap] = useState<PincodeMap>({});

  useEffect(() => {
    loadDistrictsIndex().then(setDistricts);
    loadPincodes().then(setPincodesMap);
  }, []);

  const pinResolution = useMemo(() => {
    if (homePin.length !== 6) return null;
    return resolvePincode(homePin, pincodesMap);
  }, [homePin, pincodesMap]);

  const getDistrictName = (id: string) => {
    const found = districts.find((d) => d.id === id);
    return found ? getLocalized(found, "name", lang) : id;
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = homePin.replace(/\D/g, "");
    if (clean.length !== 6) return;
    if (pinResolution && pinResolution.matches.length === 1) {
      router.push(
        `/find/?pincode=${clean}&district=${encodeURIComponent(
          pinResolution.matches[0].district_id
        )}`
      );
    } else {
      router.push(`/find/?pincode=${clean}`);
    }
  };

  return (
    <div className="space-y-12 md:space-y-16">
      {/* DUTCH EDITORIAL HERO: Asymmetric 7 + 5 Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-2 md:pt-4">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#154273]">
            {t("home.eyebrow")}
          </p>

          <h1 className="font-editorial text-[36px] sm:text-[46px] md:text-[52px] font-bold text-text tracking-[-0.02em] leading-[1.14]">
            {t("home.title")}
          </h1>

          <p className="text-[17px] sm:text-[19px] text-muted leading-relaxed max-w-[600px]">
            {t("home.sub")}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              href="/find/"
              className="inline-flex items-center justify-center min-h-btn px-7 py-3 bg-[#154273] hover:bg-[#0F3156] text-white text-[16px] font-semibold rounded-[4px] transition-colors focus-visible:outline-primary"
            >
              {t("home.cta")}
            </Link>
            <Link
              href="/directory/"
              className="inline-flex items-center justify-center min-h-btn px-6 py-3 border border-borderStrong hover:border-[#154273] bg-surface text-text text-[16px] font-semibold rounded-[4px] transition-colors"
            >
              {t("nav.directory")}
            </Link>
          </div>

          <p className="text-[13px] font-medium text-muted pt-2 border-t border-border tabular-nums">
            {t("home.statsStrip")}
          </p>
        </div>

        {/* Framed Quick PIN Lookup Panel */}
        <div className="lg:col-span-5">
          <Card padding={5} variant="default" elevation="none">
            <div className="border-l-[3px] border-[#C84B16] pl-4 mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C84B16]">
                {t("flow.quickPincode")}
              </p>
              <Heading level={3}>{t("home.pincodeCta")}</Heading>
            </div>

            <Text as="p" type="supporting" color="secondary">
              {t("home.pinHint")}
            </Text>

            <form onSubmit={handlePinSubmit} className="mt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={homePin}
                  onChange={(e) => setHomePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={t("flow.pincodePlaceholder")}
                  aria-label="Pincode search"
                  className="flex-1 min-h-btn px-3.5 py-2 text-[16px] font-medium tabular-nums border border-borderStrong rounded-[4px] bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
                <button
                  type="submit"
                  disabled={homePin.length !== 6}
                  className="min-h-btn px-5 py-2 bg-[#154273] hover:bg-[#0F3156] disabled:opacity-45 disabled:cursor-not-allowed text-white font-semibold rounded-[4px] text-[15px] transition-colors whitespace-nowrap"
                >
                  {t("flow.next")}
                </button>
              </div>

              {/* Live District Feedback right on Homepage */}
              {pinResolution && pinResolution.matches.length === 1 && (
                <Banner
                  status="success"
                  container="card"
                  title={t(
                    pinResolution.kind === "exact"
                      ? "flow.pincodeDetected"
                      : "flow.pincodePrefixDetected",
                    { district: getDistrictName(pinResolution.matches[0].district_id) }
                  )}
                />
              )}

              {pinResolution && pinResolution.matches.length > 1 && (
                <Banner
                  status="info"
                  container="card"
                  collapsible={false}
                  title={t("flow.pincodeMulti")}
                >
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pinResolution.matches.map((m) => (
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

              {pinResolution &&
                (pinResolution.kind === "invalid_prefix" ||
                  pinResolution.kind === "not_found") && (
                  <Banner status="warning" container="card" title={t("flow.pincodeNotFound")} />
                )}
            </form>
          </Card>
        </div>
      </section>

      <Divider />

      {/* HOW IT WORKS: Numbered Dutch Editorial 3-Column Strip */}
      <section aria-labelledby="how-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2
            id="how-heading"
            className="font-editorial text-[26px] sm:text-[30px] font-bold text-text tracking-[-0.01em]"
          >
            {t("home.howItWorks")}
          </h2>
        </div>

        <Card padding={0} variant="default" elevation="none">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-6 space-y-2">
              <span className="font-editorial text-[28px] font-bold text-[#154273] tabular-nums block">
                01
              </span>
              <Heading level={3}>{t("home.step1Title")}</Heading>
              <Text as="p" type="body" color="secondary">
                {t("home.step1Desc")}
              </Text>
            </div>

            <div className="p-6 space-y-2">
              <span className="font-editorial text-[28px] font-bold text-[#154273] tabular-nums block">
                02
              </span>
              <Heading level={3}>{t("home.step2Title")}</Heading>
              <Text as="p" type="body" color="secondary">
                {t("home.step2Desc")}
              </Text>
            </div>

            <div className="p-6 space-y-2">
              <span className="font-editorial text-[28px] font-bold text-[#154273] tabular-nums block">
                03
              </span>
              <Heading level={3}>{t("home.step3Title")}</Heading>
              <Text as="p" type="body" color="secondary">
                {t("home.step3Desc")}
              </Text>
            </div>
          </div>
        </Card>
      </section>

      {/* ISSUE GRID */}
      <section aria-labelledby="issues-heading" className="space-y-6">
        <div className="max-w-[660px] space-y-1.5">
          <h2
            id="issues-heading"
            className="font-editorial text-[26px] sm:text-[30px] font-bold text-text tracking-[-0.01em]"
          >
            {t("home.issuesTitle")}
          </h2>
          <Text as="p" type="body" color="secondary">
            {t("issue.subtitle")}
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ISSUES.map((issue) => (
            <Link
              key={issue.slug}
              href={`/issue/${issue.slug}/`}
              className="p-5 rounded-[6px] border border-border bg-surface hover:border-[#154273] transition-colors flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-[4px] bg-[#EBF1F6] text-[#154273] flex items-center justify-center flex-shrink-0 border border-[#D9E3EC]">
                {issue.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[17px] text-text group-hover:text-[#154273] transition-colors leading-snug">
                  {t(issue.titleKey)}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#154273] mt-2">
                  <span>{t("results.ladderBtn")}</span>
                  <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
