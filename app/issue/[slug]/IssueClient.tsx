"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/"
            className="text-[14px] text-muted hover:text-primary transition-colors"
          >
            {t("nav.home")}
          </Link>
          <span className="text-muted text-[13px]">/</span>
          <span className="text-[14px] font-semibold text-primary">{title}</span>
        </div>

        <h1 className="text-[28px] sm:text-[36px] font-extrabold text-text leading-tight mb-2">
          {title}
        </h1>

        {currentPlace && (
          <p className="text-[15px] sm:text-[16px] text-slate-700 font-medium">
            📍 {getLocalized(currentPlace, "name", lang)}
            {districtId && ` (${districtId})`}
          </p>
        )}
      </div>

      {/* Ladder Section */}
      <section aria-labelledby="ladder-heading" className="p-6 rounded-card bg-surface border border-border">
        <h2 id="ladder-heading" className="text-[20px] sm:text-[24px] font-bold text-text mb-6">
          {t("ladder.title")}
        </h2>

        <div>
          {issue.steps.map((step, idx) => {
            // Find matched local office name if available
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

      {/* Proof Checklist */}
      <Checklist items={keepItems} />

      {/* Actions */}
      <div className="p-6 rounded-card bg-primary/5 border-2 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[18px] text-text">
            {t("letter.title")} / {t("rti.title")}
          </h3>
          <p className="text-[14px] text-muted mt-0.5">
            {t("home.sub")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/letter/?district=${encodeURIComponent(districtId || "")}&place=${encodeURIComponent(
              placeId || ""
            )}&issue=${encodeURIComponent(slug)}`}
            className="flex-1 sm:flex-none text-center min-h-btn px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-btn transition-colors text-[15px]"
          >
            {t("letter.title")}
          </Link>
          <Link
            href={`/rti/?district=${encodeURIComponent(districtId || "")}&place=${encodeURIComponent(
              placeId || ""
            )}&issue=${encodeURIComponent(slug)}`}
            className="flex-1 sm:flex-none text-center min-h-btn px-5 py-2.5 bg-surface hover:bg-slate-200 border border-border text-text font-bold rounded-btn transition-colors text-[15px]"
          >
            {t("rti.title")}
          </Link>
        </div>
      </div>
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
