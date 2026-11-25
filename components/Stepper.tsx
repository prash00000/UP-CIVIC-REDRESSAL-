"use client";

import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
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
  const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="mb-7 space-y-3 no-print">
      <div className="flex items-center justify-between gap-3">
        {canBack && onBack ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            label={t("flow.back")}
            onClick={onBack}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            }
          />
        ) : (
          <div />
        )}

        <div className="tabular-nums">
          <Badge
            variant="info"
            label={t("flow.step", { step: currentStep, total: totalSteps })}
          />
        </div>
      </div>

      {/* Crisp architectural hairline progress rule */}
      <div className="w-full h-[2px] bg-border overflow-hidden">
        <div
          className="h-full bg-[#154273] transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
