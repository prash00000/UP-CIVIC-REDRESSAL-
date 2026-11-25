"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Banner } from "@astryxdesign/core/Banner";
import { Divider } from "@astryxdesign/core/Divider";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import { ResolvedOfficerItem } from "@/lib/resolver";
import CallButton from "./CallButton";
import VerifiedBadge from "./VerifiedBadge";
import FeedbackButtons from "./FeedbackButtons";

interface OfficerCardProps {
  item: ResolvedOfficerItem;
}

export default function OfficerCard({ item }: OfficerCardProps) {
  const t = useT();
  const { lang } = useLang();
  const { office, resolvedRole, isVacant, additionalChargeNote } = item;

  const roleTitle = t(`role.${resolvedRole}`);
  const officeName = getLocalized(office, "office_name", lang);
  const officerName = getLocalized(office, "officer_name", lang);
  const address = getLocalized(office, "address", lang);

  const phone = office.phones && office.phones.length > 0 ? office.phones[0] : null;

  return (
    <article className="mb-4">
      <Card padding={4} variant="default" elevation="none">
        <div className="space-y-3">
          {/* Top Eyebrow Metadata & Verification Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#154273]">
              {roleTitle}
            </span>
            {phone && <VerifiedBadge phone={phone} />}
          </div>

          {/* Office & Officer Name */}
          <div className="space-y-1">
            <Heading level={3}>{officeName}</Heading>
            {officerName && (
              <Text as="p" type="body" weight="medium">
                {officerName}
              </Text>
            )}
            {address && (
              <Text as="p" type="supporting" color="secondary">
                {address}
              </Text>
            )}
          </div>

          {/* Vacancy or Additional Charge Alerts */}
          {isVacant && (
            <Banner status="warning" container="card" title={t("results.vacant")} />
          )}

          {additionalChargeNote && (
            <Banner status="info" container="card" title={t("results.additionalCharge")} />
          )}

          <Divider />

          {/* Action / Call Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            {phone && phone.status !== "failed" ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CallButton number={phone.number} />
                <FeedbackButtons officeId={office.id} />
              </div>
            ) : (
              <Text type="body" color="secondary">
                {t("results.numberNotAvailable")}
              </Text>
            )}

            <Link
              href={`/report/?office=${encodeURIComponent(office.id)}`}
              className="text-[14px] font-medium text-muted hover:text-danger transition-colors underline-offset-4 hover:underline"
            >
              {t("results.reportError")}
            </Link>
          </div>
        </div>
      </Card>
    </article>
  );
}
