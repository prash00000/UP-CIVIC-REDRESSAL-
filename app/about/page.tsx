"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function AboutPage() {
  const t = useT();

  return (
    <div className="max-w-form mx-auto space-y-10">
      <div>
        <h1 className="text-[28px] sm:text-[36px] font-extrabold text-text">
          {t("about.title")}
        </h1>
        <p className="text-[17px] text-muted leading-relaxed mt-1">
          {t("about.subtitle")}
        </p>
      </div>

      <section aria-labelledby="mission-heading" className="space-y-3">
        <h2 id="mission-heading" className="text-[22px] font-bold text-text">
          {t("about.missionTitle")}
        </h2>
        <p className="text-[16px] text-slate-800 leading-relaxed">
          {t("about.missionText")}
        </p>
      </section>

      <section aria-labelledby="verify-heading" className="p-6 rounded-card bg-surface border border-border space-y-3">
        <h2 id="verify-heading" className="text-[22px] font-bold text-text flex items-center gap-2">
          <svg className="w-6 h-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{t("about.verificationTitle")}</span>
        </h2>
        <p className="text-[16px] text-slate-800 leading-relaxed">
          {t("about.verificationText")}
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-[14px]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success font-semibold border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success" />
            Verified (&le; 90 days)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning font-semibold border border-warning/20">
            <span className="w-2 h-2 rounded-full bg-warning" />
            Stale (&gt; 90 days)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Not verified yet
          </span>
        </div>
      </section>

      <section aria-labelledby="privacy-heading" className="space-y-3">
        <h2 id="privacy-heading" className="text-[22px] font-bold text-text flex items-center gap-2">
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t("about.privacyTitle")}</span>
        </h2>
        <p className="text-[16px] text-slate-800 leading-relaxed">
          {t("about.privacyText")}
        </p>
      </section>

      <section aria-labelledby="removal-heading" className="p-6 rounded-card bg-amber-50 border-2 border-amber-200 text-amber-950 space-y-3">
        <h2 id="removal-heading" className="text-[20px] font-bold text-amber-900">
          {t("about.removalTitle")}
        </h2>
        <p className="text-[15px] leading-relaxed text-amber-900">
          {t("about.removalText")}
        </p>
        <div className="pt-2">
          <Link
            href="/report/"
            className="inline-flex items-center gap-1.5 min-h-btn px-5 py-2.5 bg-warning hover:bg-amber-600 text-white font-bold rounded-btn transition-colors text-[15px]"
          >
            {t("results.reportError")}
          </Link>
        </div>
      </section>

      <section aria-labelledby="legal-heading" className="space-y-3 pt-4 border-t border-border text-muted">
        <h3 id="legal-heading" className="font-bold text-[18px] text-text">
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
