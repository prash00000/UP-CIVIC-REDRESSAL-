"use client";

import React from "react";
import { useT } from "@/lib/i18n";

export default function CoverageBanner() {
  const t = useT();

  return (
    <div
      role="alert"
      className="mb-6 p-4 rounded-card bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3.5"
    >
      <div className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <h4 className="font-bold text-[16px] sm:text-[17px] text-amber-900 leading-snug">
          {t("results.coverageGap")}
        </h4>
        <p className="text-[14px] sm:text-[15px] text-amber-800 mt-1 leading-relaxed">
          {t("home.sub")}
        </p>
      </div>
    </div>
  );
}
