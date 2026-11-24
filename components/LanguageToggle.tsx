"use client";

import React from "react";
import { useLang } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="inline-flex items-center rounded-btn border border-border bg-surface p-1"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`min-h-[38px] px-3.5 py-1 text-[14px] sm:text-[15px] font-semibold rounded-[8px] transition-all ${
          lang === "en"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:text-text bg-transparent"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className={`min-h-[38px] px-3.5 py-1 text-[14px] sm:text-[15px] font-semibold rounded-[8px] transition-all ${
          lang === "hi"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:text-text bg-transparent"
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
