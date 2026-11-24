"use client";

import React from "react";
import { useT, useLang, formatDate } from "@/lib/i18n";
import { Phone } from "@/lib/types";

interface VerifiedBadgeProps {
  phone: Phone;
}

export default function VerifiedBadge({ phone }: VerifiedBadgeProps) {
  const t = useT();
  const { lang } = useLang();

  if (phone.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-danger/10 text-danger border border-danger/20">
        <span className="w-2 h-2 rounded-full bg-danger" />
        {t("results.beingChecked")}
      </span>
    );
  }

  if (phone.status === "unverified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        {t("results.unverified")}
      </span>
    );
  }

  // Check if checked_on is older than 90 days
  const checkedDate = new Date(phone.checked_on);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - checkedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 90) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-warning/10 text-warning border border-warning/20">
        <span className="w-2 h-2 rounded-full bg-warning" />
        {t("results.stale")}
      </span>
    );
  }

  const formatted = formatDate(phone.checked_on, lang);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-success/10 text-success border border-success/20">
      <span className="w-2 h-2 rounded-full bg-success" />
      {t("results.verifiedOn", { date: formatted })}
    </span>
  );
}
