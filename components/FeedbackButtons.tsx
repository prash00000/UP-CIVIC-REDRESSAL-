"use client";

import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { useT } from "@/lib/i18n";

interface FeedbackButtonsProps {
  officeId: string;
}

export default function FeedbackButtons({ officeId }: FeedbackButtonsProps) {
  const t = useT();
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFeedback = async (worked: boolean) => {
    if (loading || submitted !== null) return;
    setLoading(true);

    try {
      await fetch("/api/feedback/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ office_id: officeId, worked }),
      });
    } catch {
      // In offline or static preview, fail gracefully
    } finally {
      setLoading(false);
      setSubmitted(worked);
    }
  };

  if (submitted !== null) {
    return (
      <div className="text-[14px] font-semibold text-success flex items-center gap-1.5">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{t("results.thanks")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
      <span>{t("results.didItWork")}</span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        label={t("results.yes")}
        isDisabled={loading}
        onClick={() => handleFeedback(true)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        label={t("results.no")}
        isDisabled={loading}
        onClick={() => handleFeedback(false)}
      />
    </div>
  );
}
