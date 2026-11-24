"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useT, useLang, getLocalized, formatDate } from "@/lib/i18n";
import { DistrictIndexEntry, DistrictData, OfficeLevel } from "@/lib/types";
import { loadDistrictData, loadDistrictsIndex } from "@/lib/data";
import OfficerCard from "@/components/OfficerCard";
import CoverageBadge from "@/components/CoverageBadge";

interface DistrictClientProps {
  districtId: string;
  initialMeta: DistrictIndexEntry | null;
  initialData: DistrictData | null;
}

const LEVEL_ORDER: OfficeLevel[] = [
  "district",
  "tehsil",
  "block",
  "ulb",
  "gram_panchayat",
  "division",
  "state",
];

export default function DistrictClient({
  districtId,
  initialMeta,
  initialData,
}: DistrictClientProps) {
  const t = useT();
  const { lang } = useLang();

  const [meta, setMeta] = useState<DistrictIndexEntry | null>(initialMeta);
  const [data, setData] = useState<DistrictData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialMeta) {
      loadDistrictsIndex().then((list) => {
        const found = list.find((d) => d.id === districtId);
        if (found) setMeta(found);
      });
    }
    if (!initialData) {
      loadDistrictData(districtId).then((d) => {
        setData(d);
        setLoading(false);
      });
    }
  }, [districtId, initialMeta, initialData]);

  // Group offices by administrative level
  const groupedOffices = useMemo(() => {
    if (!data?.offices) return {};
    const map: Partial<Record<OfficeLevel, typeof data.offices>> = {};
    for (const off of data.offices) {
      if (!map[off.level]) map[off.level] = [];
      map[off.level]!.push(off);
    }
    return map;
  }, [data]);

  const districtName = meta ? getLocalized(meta, "name", lang) : districtId;
  const divisionName = meta ? getLocalized(meta, "division", lang) : "";

  return (
    <div className="space-y-8 max-w-[840px] mx-auto">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-[14px] text-muted">
          <Link href="/directory/" className="hover:text-primary transition-colors">
            {t("nav.directory")}
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">{districtName}</span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[36px] font-extrabold text-text">
              {districtName}
            </h1>
            {divisionName && (
              <p className="text-[16px] text-muted mt-0.5">
                {t("directory.division", { division: divisionName })}
              </p>
            )}
          </div>

          {meta && <CoverageBadge coverage={meta.coverage} />}
        </div>

        {data?.verified_on && (
          <p className="text-[14px] text-slate-500 mt-2">
            {t("results.verifiedOn", { date: formatDate(data.verified_on, lang) })}
          </p>
        )}
      </div>

      {/* Offices list by level */}
      {loading ? (
        <div className="py-12 text-center text-muted">{t("common.loading")}</div>
      ) : (
        <div className="space-y-10">
          {LEVEL_ORDER.map((lvl) => {
            const officesInLevel = groupedOffices[lvl];
            if (!officesInLevel || officesInLevel.length === 0) return null;

            return (
              <section key={lvl} aria-labelledby={`lvl-${lvl}`}>
                <h2
                  id={`lvl-${lvl}`}
                  className="text-[20px] sm:text-[22px] font-bold text-text uppercase tracking-wide border-b-2 border-border pb-2 mb-4"
                >
                  {lvl.replace("_", " ")} level administration
                </h2>
                <div className="space-y-4">
                  {officesInLevel.map((off) => (
                    <OfficerCard
                      key={off.id}
                      item={{
                        office: off,
                        resolvedRole: off.role,
                        noPhone: off.phones.length === 0,
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
