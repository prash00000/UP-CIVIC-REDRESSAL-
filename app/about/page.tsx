"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Divider } from "@astryxdesign/core/Divider";
import { useT } from "@/lib/i18n";

export default function AboutPage() {
  const t = useT();

  return (
    <div className="max-w-form mx-auto space-y-10">
      <div className="border-b border-border pb-5 space-y-1.5">
        <h1 className="font-editorial text-[30px] sm:text-[38px] font-bold text-text">
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
        <h2 id="mission-heading" className="font-editorial text-[24px] font-bold text-text">
          {t("about.missionTitle")}
        </h2>
        <p className="text-[16px] text-text leading-relaxed">
          {t("about.missionText")}
        </p>
      </section>

      <Card padding={5} variant="default" elevation="none">
        <section aria-labelledby="verify-heading" className="space-y-4">
          <h2 id="verify-heading" className="font-editorial text-[22px] font-bold text-text flex items-center gap-2.5">
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
        <h2 id="privacy-heading" className="font-editorial text-[24px] font-bold text-text flex items-center gap-2.5">
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
            className="inline-flex items-center justify-center min-h-btn px-5 py-2 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[4px] transition-colors text-[15px]"
          >
            {t("results.reportError")}
          </Link>
        </div>
      </Banner>

      <Divider />

      <section aria-labelledby="legal-heading" className="space-y-2.5 text-muted">
        <h3 id="legal-heading" className="font-editorial font-bold text-[19px] text-text">
          {t("about.disclaimerTitle")}
        </h3>
        <p className="text-[15px] leading-relaxed">
          {t("footer.disclaimer")}
        </p>
        <p className="text-[14px]">
          Legal Basis: UP Janhit Guarantee Act, 2011; UP Panchayati Raj Act, 1947; UP Municipalities Act, 1916; UP Municipal Corporation Act, 1959.
        </p>
      </section>
    </div>
  );
}
