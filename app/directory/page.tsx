"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useT, useLang, getLocalized } from "@/lib/i18n";
import { DistrictIndexEntry } from "@/lib/types";
import { loadDistrictsIndex } from "@/lib/data";
import CoverageBadge from "@/components/CoverageBadge";

export default function DirectoryPage() {
  const t = useT();
  const { lang } = useLang();
  const [districts, setDistricts] = useState<DistrictIndexEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDistrictsIndex().then((data) => {
      setDistricts(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return districts;
    const clean = query.trim().toLowerCase();
    return districts.filter((d) => {
      const target = `${d.name_en} ${d.name_hi} ${d.division_en} ${d.division_hi}`.toLowerCase();
      return target.includes(clean);
    });
  }, [districts, query]);

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-border pb-5">
        <h1 className="page-title text-text">
          {t("directory.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed max-w-[65ch]">
          {t("directory.subtitle")}
        </p>
      </div>

      {/* Search Input */}
      <search className="max-w-form">
        <label htmlFor="directory-district-search" className="sr-only">
          {t("directory.searchPlaceholder")}
        </label>
        <input
          id="directory-district-search"
          type="search"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("directory.searchPlaceholder")}
          className="w-full min-h-[48px] px-4 py-2.5 text-[16px] border border-[#A8A295] rounded-[8px] bg-surface shadow-[0_1px_2px_rgba(22,27,34,0.03)] focus:border-[#154273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154273]/25 transition-colors"
        />
      </search>

      {/* District Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-muted">{t("common.loading")}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const districtName = getLocalized(d, "name", lang);
            const divisionName = getLocalized(d, "division", lang);

            return (
              <Link
                key={d.id}
                href={`/directory/${d.id}/`}
                className="p-5 rounded-[12px] border border-border bg-surface civic-card-interactive flex flex-col justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-[19px] text-text group-hover:text-[#154273] transition-colors mb-1">
                    {districtName}
                  </h3>
                  <p className="text-[13.5px] text-muted mb-4">
                    {t("directory.division", { division: divisionName })}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <CoverageBadge coverage={d.coverage} />
                  <span className="text-[13.5px] font-semibold text-[#154273] inline-flex items-center gap-1 whitespace-nowrap">
                    <span>{t("directory.viewOffices")}</span>
                    <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
