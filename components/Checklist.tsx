"use client";

import React from "react";
import { useT } from "@/lib/i18n";

interface ChecklistProps {
  items: string[];
}

export default function Checklist({ items }: ChecklistProps) {
  const t = useT();

  return (
    <div className="p-5 sm:p-6 rounded-card bg-surface border border-border">
      <h3 className="font-bold text-[18px] sm:text-[20px] text-text mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span>{t("checklist.title")}</span>
      </h3>
      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-[15px] sm:text-[16px] text-text">
            <span className="text-primary font-bold mt-0.5">✓</span>
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 pt-3 border-t border-border text-[13px] sm:text-[14px] text-muted italic">
        {t("ladder.keepProof")}
      </p>
    </div>
  );
}
