"use client";

import React from "react";
import { useT } from "@/lib/i18n";

export default function HelplineBar() {
  const t = useT();

  return (
    <aside
      aria-label="Helpline"
      className="sticky top-0 z-50 bg-[#0F172A] text-white py-2 px-4 border-b border-[#334155] no-print"
    >
      <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-3 text-[14px] sm:text-[15px]">
        <div className="flex items-center gap-2">
          {/* Phone SVG Icon */}
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-[#F59E0B] flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="font-semibold tracking-wide">{t("helpline.bar")}</span>
        </div>
        <a
          href="tel:1076"
          className="inline-flex items-center justify-center bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold px-3 py-1 rounded-[6px] text-[13px] sm:text-[14px] transition-colors focus-visible:outline-white"
        >
          {t("helpline.call")}
        </a>
      </div>
    </aside>
  );
}
