"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import { Issue, DistrictData, Place } from "@/lib/types";
import { loadDistrictData, loadPlacesData } from "@/lib/data";
import LadderStep from "@/components/LadderStep";
import Checklist from "@/components/Checklist";

function IssueView({
  slug,
  initialIssue,
}: {
  slug: string;
  initialIssue: Issue | null;
}) {
  const t = useT();
  const { lang } = useLang();
  const searchParams = useSearchParams();

  const districtId = searchParams.get("district");
  const placeId = searchParams.get("place");

  const [issue, setIssue] = useState<Issue | null>(initialIssue);
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    if (!initialIssue) {
      fetch(`/data/issues/${slug}.json`)
        .then((r) => r.json())
        .then(setIssue)
        .catch(console.error);
    }
  }, [slug, initialIssue]);

  useEffect(() => {
    if (districtId) {
      Promise.all([
        loadDistrictData(districtId),
        loadPlacesData(districtId),
      ]).then(([d, p]) => {
        setDistrictData(d);
        setPlaces(p);
      });
    }
  }, [districtId]);

  if (!issue) {
    return <div className="py-12 text-center text-muted">{t("common.loading")}</div>;
  }

  const title = lang === "hi" ? issue.title_hi : issue.title_en;
  const keepItems = lang === "hi" ? issue.keep_hi : issue.keep_en;
  const currentPlace = placeId ? places.find((p) => p.id === placeId) : null;

  return (
    <div className="max-w-form mx-auto space-y-8">
      <div className="space-y-3">
        <Breadcrumbs variant="supporting">
          <BreadcrumbItem href="/">{t("nav.home")}</BreadcrumbItem>
          <BreadcrumbItem isCurrent>{title}</BreadcrumbItem>
        </Breadcrumbs>

        <h1 className="font-editorial text-[30px] sm:text-[38px] font-bold text-text leading-tight">
          {title}
        </h1>

        {currentPlace && (
          <p className="text-[15px] text-muted font-medium">
            {getLocalized(currentPlace, "name", lang)}
            {districtId && ` (${districtId})`}
          </p>
        )}
      </div>

      {/* Ladder Section */}
      <Card padding={5} variant="default" elevation="none">
        <section aria-labelledby="ladder-heading">
          <h2 id="ladder-heading" className="font-editorial text-[22px] sm:text-[26px] font-bold text-text mb-6">
            {t("ladder.title")}
          </h2>

          <div>
            {issue.steps.map((step, idx) => {
              let matchedOfficeName: string | undefined;
              if (districtData) {
                const off = districtData.offices.find((o) => o.role === step.role);
                if (off) {
                  matchedOfficeName = getLocalized(off, "office_name", lang);
                }
              }

              return (
                <LadderStep
                  key={step.order}
                  step={step}
                  officerName={matchedOfficeName}
                  isLast={idx === issue.steps.length - 1}
                />
              );
            })}
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
              href={`/letter/?district=${encodeURIComponent(districtId || "")}&place=${encodeURIComponent(
                placeId || ""
              )}&issue=${encodeURIComponent(slug)}`}
              className="flex-1 sm:flex-none text-center min-h-btn inline-flex items-center justify-center px-5 py-2.5 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[4px] transition-colors text-[15px]"
            >
              {t("letter.title")}
            </Link>
            <Link
              href={`/rti/?district=${encodeURIComponent(districtId || "")}&place=${encodeURIComponent(
                placeId || ""
              )}&issue=${encodeURIComponent(slug)}`}
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
