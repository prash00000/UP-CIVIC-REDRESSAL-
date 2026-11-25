"use client";

import React from "react";
import { Badge } from "@astryxdesign/core/Badge";
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
      <Badge
        variant="success"
        label={`${t("directory.tierFull")} (${coverage.verified_pct}%)`}
        icon={<span className="w-1.5 h-1.5 rounded-full bg-current" />}
      />
    );
  }

  if (isPartial) {
    return (
      <Badge
        variant="warning"
        label={`${t("directory.tierPartial")} (${coverage.verified_pct}%)`}
        icon={<span className="w-1.5 h-1.5 rounded-full bg-current" />}
      />
    );
  }

  return (
    <Badge
      variant="neutral"
      label={t("directory.tierBasic")}
      icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
    />
  );
}
