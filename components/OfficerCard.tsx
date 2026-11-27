"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
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
  const extraPhones = office.phones && office.phones.length > 1 ? office.phones.slice(1) : [];
  const hasCallablePhone = Boolean(phone && phone.status !== "failed");

  return (
    <article className="mb-4 relative rounded-[12px] overflow-hidden">
      {hasCallablePhone && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-[#154273] z-10"
        />
      )}
      <Card
        padding={4}
        variant={hasCallablePhone ? "default" : "muted"}
        elevation={hasCallablePhone ? "low" : "none"}
      >
        <div className="space-y-3">
          {/* Top Role Badge & Verification Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant={hasCallablePhone ? "info" : "neutral"}
              label={roleTitle}
            />
            {phone ? (
              <VerifiedBadge phone={phone} />
            ) : (
              <Badge variant="neutral" label={t("results.numberNotAvailable")} />
            )}
          </div>

          {/* Office & Officer Name (explicit block display so officer name & address never collide) */}
          <div className="space-y-1">
            <Heading level={3}>{officeName}</Heading>
            {officerName && (
              <Text as="p" display="block" type="body" weight="medium">
                {officerName}
              </Text>
            )}
            {address && (
              <Text as="p" display="block" type="supporting" color="secondary">
                {address}
              </Text>
            )}
          </div>

          {/* Vacancy, Recheck, or Additional Charge Alerts */}
          {isVacant && (
            <Banner status="warning" container="card" title={t("results.vacant")} />
          )}

          {item.isRecheckFlagged && (
            <Banner status="warning" container="card" title={t("results.reportedNotWorking")} />
          )}

          {additionalChargeNote && (
            <Banner
              status="info"
              container="card"
              title={
                resolvedRole === "eo"
                  ? t("results.eoAdditionalCharge")
                  : t("results.additionalCharge")
              }
            />
          )}

          <Divider />

          {/* Secondary Contact Metadata */}
          {(extraPhones.length > 0 || office.email || office.source_url) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
              {extraPhones.map((ep) => (
                <a
                  key={ep.number}
                  href={`tel:${ep.number.replace(/[^\d+]/g, "")}`}
                  className="hover:text-[#154273] underline underline-offset-4 tabular-nums"
                >
                  {t("results.altPhone")}: {ep.number}
                </a>
              ))}
              {office.email && (
                <a
                  href={`mailto:${office.email}`}
                  className="hover:text-[#154273] underline underline-offset-4 break-all"
                >
                  {t("results.emailLabel")}: {office.email}
                </a>
              )}
              {office.source_url && (
                <a
                  href={office.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#154273] underline underline-offset-4"
                >
                  {t("results.officialSource")} ↗
                </a>
              )}
            </div>
          )}

          {/* Action / Call Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            {hasCallablePhone && phone ? (
              <div className="flex flex-wrap items-center gap-3">
                <CallButton number={phone.number} />
                <FeedbackButtons officeId={office.id} />
              </div>
            ) : (
              <Text as="p" display="block" type="supporting" color="secondary">
                {t("results.numberNotAvailable")}
              </Text>
            )}

            <Link
              href={`/report/?office=${encodeURIComponent(office.id)}`}
              className="text-[13px] font-medium text-muted hover:text-danger transition-colors underline-offset-4 hover:underline self-start sm:self-center"
            >
              {t("results.reportError")}
            </Link>
          </div>
        </div>
      </Card>
    </article>
  );
}
