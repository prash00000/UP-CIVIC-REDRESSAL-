"use client";

import React from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
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
  const formattedOrder = String(step.order).padStart(2, "0");

  return (
    <div className="relative flex gap-4 pb-8 last:pb-2">
      {/* Vertical hairline connector */}
      {!isLast && (
        <div className="absolute top-10 left-[19px] bottom-0 w-px bg-border" />
      )}

      {/* Architectural Step Index Square */}
      <div className="w-10 h-10 rounded-[4px] bg-[#154273] text-white font-bold flex items-center justify-center flex-shrink-0 z-10 text-[15px] tabular-nums border border-[#0F3156]">
        {formattedOrder}
      </div>

      {/* Step Content */}
      <div className="flex-1 pt-0.5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Heading level={4}>{roleName}</Heading>
          {officerName && (
            <Badge variant="info" label={officerName} />
          )}
        </div>

        <Text as="p" type="body">
          {howText}
        </Text>

        {/* Time Limit */}
        <div className="text-[13px] sm:text-[14px]">
          {step.time_limit_days !== null && step.time_limit_source_url ? (
            <div className="inline-flex flex-wrap items-center gap-2">
              <Badge
                variant="success"
                label={t("ladder.timeLimit", { days: step.time_limit_days })}
              />
              <a
                href={step.time_limit_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#154273] hover:text-[#0F3156] text-[13px] font-medium"
                title="Official Source"
              >
                (स्रोत / Source) ↗
              </a>
            </div>
          ) : (
            <Text type="supporting" color="secondary">
              {t("ladder.noTimeLimit")}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}
