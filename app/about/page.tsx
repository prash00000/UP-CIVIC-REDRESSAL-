"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Divider } from "@astryxdesign/core/Divider";
import { useT, useLang } from "@/lib/i18n";
import { loadStateData } from "@/lib/data";
import { StateData } from "@/lib/types";

export default function AboutPage() {
  const t = useT();
  const { lang } = useLang();
  const [stateData, setStateData] = useState<StateData | null>(null);

  useEffect(() => {
    loadStateData().then(setStateData);
  }, []);

  return (
    <div className="max-w-form mx-auto space-y-10">
      <div className="border-b border-border pb-5 space-y-2">
        <h1 className="page-title text-text">
          {t("about.title")}
        </h1>
        <p className="text-[17px] text-muted leading-relaxed">
          {t("about.subtitle")}
        </p>
      </div>

      {/* Formal Citizen-Built Non-Government Disclaimer */}
      <Banner
        status="info"
        container="card"
        collapsible={false}
        title={t("about.citizenNoticeTitle")}
        description={t("about.citizenNoticeText")}
      />

      <section aria-labelledby="mission-heading" className="space-y-3">
        <h2 id="mission-heading" className="text-[22px] font-bold text-text tracking-[-0.015em]">
          {t("about.missionTitle")}
        </h2>
        <p className="text-[16px] text-text leading-relaxed">
          {t("about.missionText")}
        </p>
      </section>

      {/* Official Government Portals & Helplines */}
      {stateData?.official_portals && stateData.official_portals.length > 0 && (
        <section aria-labelledby="portals-heading" className="space-y-4">
          <div>
            <h2 id="portals-heading" className="text-[22px] font-bold text-text tracking-[-0.015em]">
              {t("about.portalsTitle")}
            </h2>
            <p className="text-[15px] text-muted mt-1">
              {t("about.portalsSubtitle")}
            </p>
          </div>
          <Card padding={0} variant="default" elevation="low">
            <ul className="divide-y divide-border list-none p-0 m-0">
              {stateData.official_portals.map((portal) => (
                <li key={portal.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[16px] text-[#154273] hover:text-[#0F3156] underline underline-offset-4 inline-flex items-center gap-1"
                    >
                      <span>{lang === "hi" ? portal.name_hi : portal.name_en}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                    <p className="text-[14px] text-muted leading-snug">
                      {lang === "hi" ? portal.scope_hi : portal.scope_en}
                    </p>
                  </div>
                  {portal.helpline && (
                    <a
                      href={`tel:${portal.helpline.replace(/\s+/g, "")}`}
                      className="inline-flex items-center justify-center px-3.5 py-2 rounded-[8px] border border-[#A8A295] bg-[#FAF9F6] hover:border-[#154273] text-[14px] font-semibold text-text tabular-nums whitespace-nowrap self-start sm:self-center transition-colors"
                    >
                      {t("results.call")} {portal.helpline}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <Card padding={5} variant="default" elevation="low">
        <section aria-labelledby="verify-heading" className="space-y-4">
          <h2 id="verify-heading" className="text-[20px] font-bold text-text flex items-center gap-2.5 tracking-[-0.015em]">
            <svg className="w-5 h-5 text-[#245937]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{t("about.verificationTitle")}</span>
          </h2>
          <p className="text-[16px] text-text leading-relaxed">
            {t("about.verificationText")}
          </p>
          <div className="pt-1 flex flex-wrap gap-2.5">
            <Badge variant="success" label="Verified (<= 90 days)" />
            <Badge variant="warning" label="Stale (> 90 days)" />
            <Badge variant="neutral" label="Not verified yet" />
          </div>
        </section>
      </Card>

      <section aria-labelledby="privacy-heading" className="space-y-3">
        <h2 id="privacy-heading" className="text-[22px] font-bold text-text flex items-center gap-2.5 tracking-[-0.015em]">
          <svg className="w-5 h-5 text-[#154273]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t("about.privacyTitle")}</span>
        </h2>
        <p className="text-[16px] text-text leading-relaxed">
          {t("about.privacyText")}
        </p>
      </section>

      <Banner
        status="warning"
        container="card"
        collapsible={false}
        title={t("about.removalTitle")}
        description={t("about.removalText")}
      >
        <div className="pt-2">
          <Link
            href="/report/"
            className="inline-flex items-center justify-center min-h-[46px] px-5 py-2 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[8px] transition-colors text-[15px]"
          >
            {t("results.reportError")}
          </Link>
        </div>
      </Banner>

      <Divider />

      <section aria-labelledby="legal-heading" className="space-y-2.5 text-muted">
        <h3 id="legal-heading" className="font-bold text-[18px] text-text">
          {t("about.disclaimerTitle")}
        </h3>
        <p className="text-[15px] leading-relaxed">
          {t("footer.disclaimer")}
        </p>
        <p className="text-[14px]">
          Legal Basis: UP Janhit Guarantee Act, 2011; UP Panchayati Raj Act, 1947; UP Municipalities Act, 1916; UP Municipal Corporation Act, 1959; UP RTI Rules, 2015.
        </p>
      </section>
    </div>
  );
}
