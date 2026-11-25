"use client";

import React from "react";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Divider } from "@astryxdesign/core/Divider";
import { Text } from "@astryxdesign/core/Text";
import { useT } from "@/lib/i18n";

interface ChecklistProps {
  items: string[];
}

export default function Checklist({ items }: ChecklistProps) {
  const t = useT();

  return (
    <Card padding={4} variant="default" elevation="none">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-[#154273] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <Heading level={3}>{t("checklist.title")}</Heading>
        </div>

        <ul className="space-y-2.5 list-none p-0 m-0">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[15px] sm:text-[16px] text-text">
              <span className="text-[#154273] font-bold mt-0.5 tabular-nums">
                {String(idx + 1).padStart(2, "0")}.
              </span>
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        <Divider />

        <Text as="p" type="supporting" color="secondary">
          {t("ladder.keepProof")}
        </Text>
      </div>
    </Card>
  );
}
