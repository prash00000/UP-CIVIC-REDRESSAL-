"use client";

import React from "react";
import { useT } from "@/lib/i18n";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  canBack?: boolean;
}

export default function Stepper({
  currentStep,
  totalSteps,
  onBack,
  canBack = true,
}: StepperProps) {
  const t = useT();

  return (
    <div className="flex items-center justify-between gap-3 mb-6 no-print">
      {canBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="min-h-touch inline-flex items-center gap-1.5 px-3 py-1.5 text-muted hover:text-text font-medium text-[15px] rounded-btn border border-border hover:bg-surface transition-colors focus-visible:outline-primary"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>{t("flow.back")}</span>
        </button>
      ) : (
        <div />
      )}

      <div className="text-right">
        <span className="text-[14px] sm:text-[15px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {t("flow.step", { step: currentStep, total: totalSteps })}
        </span>
      </div>
    </div>
  );
}
