"use client";

import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
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
  const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  const milestones = [
    { step: 1, label: labels?.[0] || t("find.wizardStep1") },
    { step: 2, label: labels?.[1] || t("find.wizardStep2") },
    { step: 3, label: labels?.[2] || t("find.wizardStep3") },
  ];

  return (
    <nav aria-label="Wizard progress" className="mb-7 space-y-3 no-print">
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

      {/* Interactive Milestone Steps */}
      <ol className="grid grid-cols-3 gap-2 text-[12px] sm:text-[13px]">
        {milestones.map((m) => {
          const isCompleted = m.step < currentStep;
          const isCurrent = m.step === currentStep;
          const clickable = isCompleted && !!onStepClick;

          return (
            <li key={m.step}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(m.step)}
                className={`w-full text-left pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  isCurrent
                    ? "border-[#154273] text-[#154273] font-bold"
                    : isCompleted
                    ? "border-[#245937] text-[#245937] font-semibold hover:opacity-80 cursor-pointer"
                    : "border-border text-muted font-medium cursor-default"
                }`}
              >
                <span className="tabular-nums">
                  {isCompleted ? "✓" : `${m.step}.`}
                </span>
                <span className="truncate">{m.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Crisp architectural hairline progress rule */}
      <div className="w-full h-[2px] bg-border overflow-hidden">
        <div
          className="h-full bg-[#154273] transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </nav>
  );
}
