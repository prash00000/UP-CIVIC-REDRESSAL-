"use client";

import React from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { useT } from "@/lib/i18n";

export default function CoverageBanner() {
  const t = useT();

  return (
    <div role="alert" className="mb-4">
      <Banner
        status="warning"
        container="card"
        title={t("results.coverageGap")}
      />
    </div>
  );
}
