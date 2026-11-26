"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { useT, useLang, getLocalized, formatDate } from "@/lib/i18n";
import { DistrictIndexEntry, DistrictData, Office, OfficeLevel } from "@/lib/types";
import { loadDistrictData, loadDistrictsIndex, loadRecheckOffices } from "@/lib/data";
import OfficerCard from "@/components/OfficerCard";
import CoverageBadge from "@/components/CoverageBadge";

interface DistrictClientProps {
  districtId: string;
  initialMeta: DistrictIndexEntry | null;
  initialData: DistrictData | null;
}

type RoleFilterKind = "all" | "hq" | "sdm" | "block" | "ulb";

const LEVEL_ORDER: OfficeLevel[] = [
  "district",
  "tehsil",
  "block",
  "ulb",
  "gram_panchayat",
  "division",
  "state",
];

function matchesRoleFilter(off: Office, filter: RoleFilterKind): boolean {
  if (filter === "all") return true;
  if (filter === "hq") {
    return (
      off.level === "district" ||
      off.level === "division" ||
      off.role === "dm" ||
      off.role === "cdo" ||
      off.role === "dpro"
    );
  }
  if (filter === "sdm") {
    return off.level === "tehsil" || off.role === "sdm" || off.role === "tehsildar";
  }
  if (filter === "block") {
    return off.level === "block" || off.role === "bdo" || off.role === "ado_panchayat";
  }
  return (
    off.level === "ulb" ||
    off.role === "eo" ||
    off.role === "commissioner" ||
    off.role === "mayor" ||
    off.role === "chairman" ||
    off.role === "other"
  );
}

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
  const [recheckIds, setRecheckIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterKind>("all");

  useEffect(() => {
    loadRecheckOffices().then(setRecheckIds);
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

  const phoneMetrics = useMemo(() => {
    const offices = data?.offices || [];
    const bdos = offices.filter((o) => o.role === "bdo");
    const eos = offices.filter((o) => o.role === "eo" || o.role === "commissioner");
    return {
      bdoVerified: bdos.filter((o) => o.phones.length > 0).length,
      bdoTotal: bdos.length,
      eoVerified: eos.filter((o) => o.phones.length > 0).length,
      eoTotal: eos.length,
      totalPhones: offices.filter((o) => o.phones.length > 0).length,
      totalOffices: offices.length,
    };
  }, [data]);

  const filteredOffices = useMemo(() => {
    const offices = data?.offices || [];
    const q = searchQuery.trim().toLowerCase();
    return offices.filter((off) => {
      if (!matchesRoleFilter(off, roleFilter)) return false;
      if (!q) return true;
      const haystack = [
        off.office_name_en,
        off.office_name_hi,
        off.officer_name_en || "",
        off.officer_name_hi || "",
        off.email || "",
        ...off.phones.map((p) => p.number),
        ...off.covers,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, roleFilter, searchQuery]);

  const groupedOffices = useMemo(() => {
    const map: Partial<Record<OfficeLevel, Office[]>> = {};
    for (const off of filteredOffices) {
      if (!map[off.level]) {
        map[off.level] = [];
      }
      map[off.level]!.push(off);
    }
    return map;
  }, [filteredOffices]);

  const districtName = meta ? getLocalized(meta, "name", lang) : districtId;
  const divisionName = meta ? getLocalized(meta, "division", lang) : "";

  let sectionCounter = 0;

  return (
    <div className="space-y-8 max-w-[880px] mx-auto">
      <div className="space-y-3 border-b border-border pb-5">
        <Breadcrumbs variant="supporting">
          <BreadcrumbItem href="/directory/">{t("nav.directory")}</BreadcrumbItem>
          <BreadcrumbItem isCurrent>{districtName}</BreadcrumbItem>
        </Breadcrumbs>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="font-editorial text-[30px] sm:text-[38px] font-bold text-text">
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
          <p className="text-[14px] text-muted tabular-nums">
            {t("results.verifiedOn", { date: formatDate(data.verified_on, lang) })}
          </p>
        )}

        {!loading && data && (
          <p className="text-[13px] font-medium text-[#154273] bg-[#EBF1F6] border border-[#154273]/25 rounded-[4px] px-3 py-2 tabular-nums">
            {t("directory.verifiedSummary", phoneMetrics)}
          </p>
        )}
      </div>

      {/* In-district Search & Role Filter Strip */}
      {!loading && data && data.offices.length > 0 && (
        <div className="space-y-3 p-4 rounded-[6px] bg-surface border border-border">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("directory.filterSearchPlaceholder")}
            aria-label={t("directory.filterSearchPlaceholder")}
            className="w-full min-h-btn px-4 py-2 bg-bg text-text text-[15px] border border-borderStrong rounded-[4px] focus:border-[#154273] focus-visible:outline-none"
          />

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "all", key: "directory.pillAll" },
                { id: "hq", key: "directory.pillHq" },
                { id: "sdm", key: "directory.pillSdm" },
                { id: "block", key: "directory.pillBlock" },
                { id: "ulb", key: "directory.pillUlb" },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setRoleFilter(pill.id)}
                className={`px-3 py-1.5 text-[13px] font-semibold rounded-[4px] border transition-colors ${
                  roleFilter === pill.id
                    ? "bg-[#154273] text-white border-[#154273]"
                    : "bg-bg text-text border-border hover:border-[#154273]"
                }`}
              >
                {t(pill.key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted">{t("common.loading")}</div>
      ) : filteredOffices.length === 0 ? (
        <div className="py-10 text-center text-muted bg-surface border border-border rounded-[6px]">
          {t("directory.noMatchingOffices")}
        </div>
      ) : (
        <div className="space-y-10">
          {LEVEL_ORDER.map((lvl) => {
            const officesInLevel = groupedOffices[lvl];
            if (!officesInLevel || officesInLevel.length === 0) return null;
            sectionCounter += 1;

            return (
              <section key={lvl} aria-labelledby={`lvl-${lvl}`}>
                <div className="flex items-baseline gap-3 border-b border-border pb-2 mb-4">
                  <span className="font-editorial text-[16px] font-bold text-[#154273] tabular-nums">
                    {String(sectionCounter).padStart(2, "0")}
                  </span>
                  <h2
                    id={`lvl-${lvl}`}
                    className="text-[16px] font-bold text-text uppercase tracking-[0.06em]"
                  >
                    {t(`directory.level.${lvl}`)}
                  </h2>
                </div>
                <div className="space-y-4">
                  {officesInLevel.map((off) => (
                    <OfficerCard
                      key={off.id}
                      item={{
                        office: off,
                        resolvedRole: off.role,
                        noPhone: off.phones.length === 0,
                        isRecheckFlagged: recheckIds.has(off.id),
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
