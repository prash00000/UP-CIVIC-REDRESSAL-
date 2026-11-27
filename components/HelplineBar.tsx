"use client";

import React from "react";
import { useT } from "@/lib/i18n";

export default function HelplineBar() {
  const t = useT();

  return (
    <aside
      aria-label="Helpline"
      className="sticky top-0 z-50 bg-[#0F2C4C] text-white border-t-[3px] border-[#C84B16] border-b border-[#1D446E] py-2 px-4 no-print shadow-[0_2px_8px_rgba(15,44,76,0.18)]"
    >
      <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-3 text-[13px] sm:text-[14px]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className="inline-block w-2 h-2 rounded-full bg-[#F39C72] flex-shrink-0"
          />
          <span className="font-medium tracking-[0.01em] text-[#EEF3F8] leading-snug tabular-nums text-[12.5px] sm:text-[14px]">
            {t("helpline.bar")}
          </span>
        </div>
        <a
          href="tel:1076"
          className="inline-flex items-center justify-center gap-1.5 bg-[#C84B16] hover:bg-[#AD3E0F] active:scale-[0.98] text-white font-semibold px-3.5 py-1.5 rounded-[8px] text-[13px] transition-all tabular-nums whitespace-nowrap flex-shrink-0 focus-visible:outline-white shadow-sm"
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>{t("helpline.call")}</span>
        </a>
      </div>
    </aside>
  );
}
