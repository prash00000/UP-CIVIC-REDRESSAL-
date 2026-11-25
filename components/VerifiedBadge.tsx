"use client";

import React from "react";
import { Badge } from "@astryxdesign/core/Badge";
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
      <Badge
        variant="error"
        label={t("results.beingChecked")}
        icon={<span className="w-1.5 h-1.5 rounded-full bg-current" />}
      />
    );
  }

  if (phone.status === "unverified") {
    return (
      <Badge
        variant="neutral"
        label={t("results.unverified")}
        icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
      />
    );
  }

  const checkedDate = new Date(phone.checked_on);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - checkedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 90) {
    return (
      <Badge
        variant="warning"
        label={t("results.stale")}
        icon={<span className="w-1.5 h-1.5 rounded-full bg-current" />}
      />
    );
  }

  const formatted = formatDate(phone.checked_on, lang);
  return (
    <Badge
      variant="success"
      label={t("results.verifiedOn", { date: formatted })}
      icon={<span className="w-1.5 h-1.5 rounded-full bg-current" />}
    />
  );
}
