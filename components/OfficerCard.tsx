"use client";

import React from "react";
import Link from "next/link";
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
    <article className="p-5 sm:p-6 bg-bg border-2 border-border rounded-card shadow-sm mb-4 transition-all hover:border-slate-300">
      {/* Role & Badges */}
      <div className="flex flex-wrap items-start justify-between gap-2.5 mb-2">
        <span className="inline-block px-3 py-1 rounded-md text-[13px] sm:text-[14px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
          {roleTitle}
        </span>
        {phone && <VerifiedBadge phone={phone} />}
      </div>

      {/* Office & Officer Name */}
      <h3 className="font-bold text-[20px] sm:text-[22px] text-text leading-snug">
        {officeName}
      </h3>
      {officerName && (
        <p className="text-[16px] sm:text-[17px] font-medium text-slate-800 mt-0.5">
          {officerName}
        </p>
      )}

      {/* Address if present */}
      {address && (
        <p className="text-[14px] sm:text-[15px] text-muted mt-1 leading-normal">
          {address}
        </p>
      )}

      {/* Vacancy or Additional Charge Alerts */}
      {isVacant && (
        <div className="mt-3 p-3 rounded-btn bg-amber-50 border border-amber-300 text-amber-900 text-[14px] font-medium">
          {t("results.vacant")}
        </div>
      )}

      {additionalChargeNote && (
        <div className="mt-3 p-3 rounded-btn bg-blue-50 border border-blue-200 text-blue-900 text-[14px] font-medium">
          {t("results.additionalCharge")}
        </div>
      )}

      {/* Action / Call Row */}
      <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {phone && phone.status !== "failed" ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CallButton number={phone.number} />
            <FeedbackButtons officeId={office.id} />
          </div>
        ) : (
          <div className="text-[15px] font-medium text-muted">
            {t("results.numberNotAvailable")}
          </div>
        )}

        <Link
          href={`/report/?office=${encodeURIComponent(office.id)}`}
          className="text-[14px] font-medium text-slate-600 hover:text-danger transition-colors underline-offset-4 hover:underline"
        >
          {t("results.reportError")}
        </Link>
      </div>
    </article>
  );
}
