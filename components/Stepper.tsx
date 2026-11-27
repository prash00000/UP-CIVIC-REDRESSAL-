"use client";

import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Stepper as AstryxStepper, Step } from "@astryxdesign/core/Stepper";
import { useT } from "@/lib/i18n";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onStepClick?: (step: number) => void;
  canBack?: boolean;
  labels?: [string, string, string];
}

export default function Stepper({
  currentStep,
  totalSteps,
  onBack,
  onStepClick,
  canBack = true,
  labels,
}: StepperProps) {
  const t = useT();

  const milestones = [
    labels?.[0] || t("find.wizardStep1"),
    labels?.[1] || t("find.wizardStep2"),
    labels?.[2] || t("find.wizardStep3"),
  ];

  return (
    <nav
      aria-label="Wizard progress"
      className="mb-7 space-y-4 p-4 rounded-[12px] bg-surface border border-border shadow-[0_1px_3px_rgba(22,27,34,0.04)] no-print"
    >
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
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t("nav.find")}
          </span>
        )}

        <div className="tabular-nums">
          <Badge
            variant="info"
            label={t("flow.step", { step: currentStep, total: totalSteps })}
          />
        </div>
      </div>

      <AstryxStepper
        activeStep={Math.max(0, currentStep - 1)}
        indicatorPosition="on-track"
        density="compact"
        label={t("nav.find")}
        horizontalOptions={{ minimumStepWidth: 96, collapsedVariant: "withLabel" }}
        onStepClick={
          onStepClick
            ? (idx) => {
                if (idx < currentStep - 1) {
                  onStepClick(idx + 1);
                }
              }
            : undefined
        }
      >
        {milestones.map((label, idx) => (
          <Step
            key={idx}
            step={idx}
            label={label}
            isDisabled={idx > currentStep - 1}
          />
        ))}
      </AstryxStepper>
    </nav>
  );
}
