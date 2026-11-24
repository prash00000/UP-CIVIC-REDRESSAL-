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
      <div>
        <h1 className="text-[28px] sm:text-[36px] font-extrabold text-text">
          {t("directory.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed mt-1">
          {t("directory.subtitle")}
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("directory.searchPlaceholder")}
          className="w-full min-h-btn px-4 py-2.5 text-[16px] sm:text-[17px] border-2 border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
        />
      </div>

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
                className="p-5 rounded-card border-2 border-border bg-bg hover:border-primary hover:bg-surface transition-all flex flex-col justify-between shadow-sm group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-[20px] text-text group-hover:text-primary transition-colors">
                      {districtName}
                    </h3>
                  </div>
                  <p className="text-[14px] text-muted mb-4">
                    {t("directory.division", { division: divisionName })}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <CoverageBadge coverage={d.coverage} />
                  <span className="text-[14px] font-semibold text-primary inline-flex items-center gap-1">
                    <span>{t("directory.viewOffices")}</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
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
