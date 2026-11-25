"use client";

import React from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import { IssueStep } from "@/lib/types";
import { ResolvedOfficerItem } from "@/lib/resolver";
import CallButton from "./CallButton";
import VerifiedBadge from "./VerifiedBadge";

interface LadderStepProps {
  step: IssueStep;
  officerName?: string;
  resolvedOfficer?: ResolvedOfficerItem;
  fallbackOfficer?: ResolvedOfficerItem;
  isPrimaryAction?: boolean;
  isLast?: boolean;
}

export default function LadderStep({
  step,
  officerName,
  resolvedOfficer,
  fallbackOfficer,
  isPrimaryAction = false,
  isLast = false,
}: LadderStepProps) {
  const t = useT();
  const { lang } = useLang();

  const roleName = t(`role.${step.role}`);
  const howText = lang === "hi" ? step.how_hi : step.how_en;
  const formattedOrder = String(step.order).padStart(2, "0");

  const primaryPhone =
    resolvedOfficer?.office.phones?.find((p) => p.status !== "failed") || null;
  const fallbackPhone =
    fallbackOfficer?.office.phones?.find((p) => p.status !== "failed") || null;
  const activeOfficeName = resolvedOfficer
    ? getLocalized(resolvedOfficer.office, "office_name", lang)
    : officerName;
  const activeOfficerPerson = resolvedOfficer
    ? getLocalized(resolvedOfficer.office, "officer_name", lang)
    : undefined;

  return (
    <div className="relative flex gap-4 pb-8 last:pb-2">
      {/* Vertical hairline connector */}
      {!isLast && (
        <div className="absolute top-10 left-[19px] bottom-0 w-px bg-border" />
      )}

      {/* Architectural Step Index Square */}
      <div
        className={`w-10 h-10 rounded-[4px] text-white font-bold flex items-center justify-center flex-shrink-0 z-10 text-[15px] tabular-nums border ${
          isPrimaryAction
            ? "bg-[#C84B16] border-[#AD3E0F]"
            : "bg-[#154273] border-[#0F3156]"
        }`}
      >
        {formattedOrder}
      </div>

      {/* Step Content */}
      <div className="flex-1 pt-0.5 space-y-2.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Heading level={4}>{roleName}</Heading>
          {isPrimaryAction && (
            <Badge variant="warning" label={t("issue.startHereBadge")} />
          )}
          {!resolvedOfficer && activeOfficeName && (
            <Badge variant="info" label={activeOfficeName} />
          )}
        </div>

        <Text as="p" type="body">
          {howText}
        </Text>

        {/* Resolved Local Officer Action Card directly inside step */}
        {resolvedOfficer && (
          <div className="p-3.5 rounded-[4px] bg-bg border border-border space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-text leading-snug">
                  {activeOfficeName}
                </p>
                {activeOfficerPerson && (
                  <p className="text-[13px] text-muted">{activeOfficerPerson}</p>
                )}
              </div>
              {primaryPhone && <VerifiedBadge phone={primaryPhone} />}
            </div>

            {resolvedOfficer.isVacant && (
              <Banner status="warning" container="card" title={t("results.vacant")} />
            )}

            {resolvedOfficer.additionalChargeNote && (
              <Banner
                status="info"
                container="card"
                title={
                  resolvedOfficer.resolvedRole === "eo"
                    ? t("results.eoAdditionalCharge")
                    : t("results.additionalCharge")
                }
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              {primaryPhone ? (
                <CallButton number={primaryPhone.number} />
              ) : fallbackOfficer && fallbackPhone ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <CallButton number={fallbackPhone.number} />
                  <span className="text-[13px] text-muted">
                    ({getLocalized(fallbackOfficer.office, "office_name", lang)})
                  </span>
                </div>
              ) : (
                <Text type="supporting" color="secondary">
                  {t("results.numberNotAvailable")}
                </Text>
              )}

              {resolvedOfficer.office.email && (
                <a
                  href={`mailto:${resolvedOfficer.office.email}`}
                  className="text-[13px] text-[#154273] hover:underline break-all"
                >
                  {resolvedOfficer.office.email}
                </a>
              )}
            </div>
          </div>
        )}

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
