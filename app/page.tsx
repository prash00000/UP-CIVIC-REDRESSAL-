"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

const ISSUES = [
  { slug: "street-light", icon: "💡", titleKey: "issue.street-light" },
  { slug: "drain", icon: "🌊", titleKey: "issue.drain" },
  { slug: "road", icon: "🛣️", titleKey: "issue.road" },
  { slug: "handpump-water", icon: "🚰", titleKey: "issue.handpump-water" },
  { slug: "mgnrega", icon: "💼", titleKey: "issue.mgnrega" },
  { slug: "garbage", icon: "🗑️", titleKey: "issue.garbage" },
];

export default function HomePage() {
  const t = useT();
  const router = useRouter();
  const [homePin, setHomePin] = useState("");

  return (
    <div className="space-y-12 md:space-y-16">
      {/* HERO SECTION */}
      <section className="text-center max-w-[760px] mx-auto pt-4 md:pt-8">
        <h1 className="text-[34px] sm:text-[44px] md:text-[48px] font-extrabold text-text tracking-tight leading-tight mb-4">
          {t("home.title")}
        </h1>
        <p className="text-[17px] sm:text-[19px] text-muted leading-relaxed mb-8 max-w-[660px] mx-auto">
          {t("home.sub")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/find/"
            className="w-full sm:w-auto inline-flex items-center justify-center min-h-btn px-8 py-3.5 bg-primary hover:bg-primary-hover text-white text-[18px] font-bold rounded-btn transition-colors shadow-md focus-visible:outline-primary"
          >
            {t("home.cta")}
          </Link>
          <Link
            href="/directory/"
            className="w-full sm:w-auto inline-flex items-center justify-center min-h-btn px-6 py-3.5 border-2 border-border hover:border-slate-400 bg-surface text-text text-[17px] font-semibold rounded-btn transition-colors"
          >
            {t("nav.directory")}
          </Link>
        </div>

        {/* Quick PIN Code Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = homePin.replace(/\D/g, "");
            if (clean.length === 6) {
              router.push(`/find/?pincode=${clean}`);
            }
          }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-[420px] mx-auto"
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={homePin}
            onChange={(e) => setHomePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={t("flow.pincodePlaceholder")}
            aria-label="Pincode search"
            className="w-full sm:w-60 min-h-btn px-4 py-2.5 text-center text-[16px] font-medium border-2 border-border rounded-btn bg-surface focus:border-primary focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={homePin.length !== 6}
            className="w-full sm:w-auto min-h-btn px-5 py-2.5 bg-primary disabled:opacity-50 hover:bg-primary-hover text-white font-bold rounded-btn transition-colors text-[16px]"
          >
            {t("flow.next")}
          </button>
        </form>
      </section>

      {/* HOW IT WORKS (3 Steps) */}
      <section aria-labelledby="how-heading" className="p-6 md:p-8 rounded-card bg-surface border border-border">
        <h2 id="how-heading" className="text-[22px] sm:text-[26px] font-bold text-text text-center mb-8">
          {t("home.howItWorks")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-extrabold text-[20px] flex items-center justify-center mb-3">
              1
            </div>
            <h3 className="font-bold text-[18px] text-text mb-1">
              {t("home.step1Title")}
            </h3>
            <p className="text-[15px] text-muted leading-relaxed">
              {t("home.step1Desc")}
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-extrabold text-[20px] flex items-center justify-center mb-3">
              2
            </div>
            <h3 className="font-bold text-[18px] text-text mb-1">
              {t("home.step2Title")}
            </h3>
            <p className="text-[15px] text-muted leading-relaxed">
              {t("home.step2Desc")}
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-extrabold text-[20px] flex items-center justify-center mb-3">
              3
            </div>
            <h3 className="font-bold text-[18px] text-text mb-1">
              {t("home.step3Title")}
            </h3>
            <p className="text-[15px] text-muted leading-relaxed">
              {t("home.step3Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* ISSUE GRID */}
      <section aria-labelledby="issues-heading">
        <div className="text-center max-w-[600px] mx-auto mb-8">
          <h2 id="issues-heading" className="text-[26px] sm:text-[30px] font-bold text-text mb-2">
            {t("home.issuesTitle")}
          </h2>
          <p className="text-[16px] text-muted">
            {t("issue.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ISSUES.map((issue) => (
            <Link
              key={issue.slug}
              href={`/issue/${issue.slug}/`}
              className="p-5 rounded-card border-2 border-border bg-bg hover:border-primary hover:bg-surface transition-all flex items-start gap-4 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-[20px] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[18px] text-text group-hover:text-primary transition-colors leading-snug">
                  {t(issue.titleKey)}
                </h3>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary mt-2">
                  <span>{t("results.ladderBtn")}</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
