"use client";

import React from "react";
import { useT, useLang } from "@/lib/i18n";
import { IssueStep } from "@/lib/types";

interface LadderStepProps {
  step: IssueStep;
  officerName?: string;
  isLast?: boolean;
}

export default function LadderStep({ step, officerName, isLast = false }: LadderStepProps) {
  const t = useT();
  const { lang } = useLang();

  const roleName = t(`role.${step.role}`);
  const howText = lang === "hi" ? step.how_hi : step.how_en;

  return (
    <div className="relative flex gap-4 pb-8 last:pb-2">
      {/* Step line */}
      {!isLast && (
        <div className="absolute top-10 left-5 bottom-0 w-0.5 bg-border -translate-x-1/2" />
      )}

      {/* Step Number Circle */}
      <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0 z-10 text-[16px] shadow-sm">
        {step.order}
      </div>

      {/* Step Content */}
      <div className="flex-1 pt-1">
        <div className="flex flex-wrap items-baseline gap-2 mb-1">
          <h4 className="font-bold text-[18px] text-text">
            {roleName}
          </h4>
          {officerName && (
            <span className="text-[14px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {officerName}
            </span>
          )}
        </div>

        <p className="text-[15px] sm:text-[16px] text-slate-800 leading-relaxed mb-2">
          {howText}
        </p>

        {/* Time Limit */}
        <div className="text-[13px] sm:text-[14px]">
          {step.time_limit_days !== null && step.time_limit_source_url ? (
            <div className="inline-flex items-center gap-1.5 font-semibold text-success bg-success/10 px-2.5 py-1 rounded">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{t("ladder.timeLimit", { days: step.time_limit_days })}</span>
              <a
                href={step.time_limit_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-success text-[12px] ml-1"
                title="Official Source"
              >
                (स्रोत / Source)
              </a>
            </div>
          ) : (
            <span className="text-muted italic">
              {t("ladder.noTimeLimit")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
