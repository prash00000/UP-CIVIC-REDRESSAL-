"use client";

import React from "react";
import { useT } from "@/lib/i18n";
import { DistrictCoverage } from "@/lib/types";

interface CoverageBadgeProps {
  coverage: DistrictCoverage;
}

export default function CoverageBadge({ coverage }: CoverageBadgeProps) {
  const t = useT();

  const isFull = coverage.tier2 >= 90 && coverage.verified_pct >= 80;
  const isPartial = !isFull && coverage.tier1 >= 90;

  if (isFull) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold bg-success/10 text-success border border-success/30">
        <span className="w-2 h-2 rounded-full bg-success" />
        {t("directory.tierFull")} ({coverage.verified_pct}%)
      </span>
    );
  }

  if (isPartial) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold bg-warning/10 text-warning border border-warning/30">
        <span className="w-2 h-2 rounded-full bg-warning" />
        {t("directory.tierPartial")} ({coverage.verified_pct}%)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      {t("directory.tierBasic")}
    </span>
  );
}
