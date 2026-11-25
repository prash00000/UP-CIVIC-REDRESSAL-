"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { useT, useLang, getLocalized, formatDate } from "@/lib/i18n";
import { DistrictData, Place } from "@/lib/types";
import { loadDistrictData, loadPlacesData } from "@/lib/data";
import PrintSheet from "@/components/PrintSheet";

function RtiContent() {
  const t = useT();
  const { lang } = useLang();
  const searchParams = useSearchParams();

  const districtParam = searchParams.get("district") || "";
  const placeParam = searchParams.get("place") || "";

  const [applicantName, setApplicantName] = useState("");
  const [address, setAddress] = useState("");
  const [publicAuthority, setPublicAuthority] = useState("");
  const [subjectKey, setSubjectKey] = useState("rti.subject1");
  const [details, setDetails] = useState("");

  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  // [VERIFY: UP RTI Rules] Fee amount and specific form schedule under UP RTI Rules 2015/2016
  // As per Section 7.6, never hardcode fee amount in UI until formally verified.

  useEffect(() => {
    if (districtParam) {
      Promise.all([
        loadDistrictData(districtParam),
        loadPlacesData(districtParam),
      ]).then(([d, p]) => {
        setDistrictData(d);
        setPlaces(p);
      });
    }
  }, [districtParam]);

  useEffect(() => {
    if (places.length > 0 && placeParam) {
      const pl = places.find((p) => p.id === placeParam);
      if (pl) {
        setAddress(
          `${getLocalized(pl, "name", lang)}, ${pl.block_id || pl.tehsil_id || ""}, ${districtParam}`
        );
      }
    }
  }, [places, placeParam, districtParam, lang]);

  useEffect(() => {
    if (districtData?.offices && districtData.offices.length > 0 && !publicAuthority) {
      const bdo = districtData.offices.find((o) => o.role === "bdo");
      const dpro = districtData.offices.find((o) => o.role === "dpro");
      const eo = districtData.offices.find((o) => o.role === "eo");
      const chosen = bdo || eo || dpro || districtData.offices[0];
      setPublicAuthority(
        `Public Information Officer (PIO), ${getLocalized(chosen, "office_name", lang)}`
      );
    }
  }, [districtData, publicAuthority, lang]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const subjectText = t(subjectKey);

  return (
    <div className="max-w-[840px] mx-auto space-y-8">
      {/* Page Title (hidden on print) */}
      <div className="no-print space-y-2 border-b border-border pb-5">
        <h1 className="font-editorial text-[30px] sm:text-[36px] font-bold text-text">
          {t("rti.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed">
          {t("rti.subtitle")}
        </p>
      </div>

      {/* FORM INPUTS (hidden on print) */}
      <section aria-label="RTI Form" className="no-print">
        <Card padding={5} variant="default" elevation="none">
          <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("rti.applicantName")} *
            </label>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="e.g. Ram Prasad"
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("rti.publicAuthority")} *
            </label>
            <input
              type="text"
              value={publicAuthority}
              onChange={(e) => setPublicAuthority(e.target.value)}
              placeholder="e.g. PIO, Office of BDO"
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-label font-semibold text-text mb-1">
            {t("rti.applicantAddress")} *
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Complete postal address for correspondence"
            className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
          />
        </div>

        <div>
          <label className="block text-label font-semibold text-text mb-1">
            {t("rti.subject")}
          </label>
          <select
            value={subjectKey}
            onChange={(e) => setSubjectKey(e.target.value)}
            className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
          >
            <option value="rti.subject1">{t("rti.subject1")}</option>
            <option value="rti.subject2">{t("rti.subject2")}</option>
            <option value="rti.subject3">{t("rti.subject3")}</option>
          </select>
        </div>

        <div>
          <label className="block text-label font-semibold text-text mb-1">
            {t("rti.details")}
          </label>
          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Specific questions, Measurement Book (MB) pages, sanctioned estimates, or dates..."
            className="w-full p-4 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none text-[15px]"
          />
        </div>

        {/* Official Fee Notice Alert (Mandatory rule: no hardcoded fee!) */}
        <Banner status="warning" container="card" title={t("rti.feeNotice")} />

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="md"
            label={t("rti.print")}
            onClick={handlePrint}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            }
          />
        </div>
          </div>
        </Card>
      </section>

      {/* RENDERED RTI DRAFT (FORM - A) */}
      <PrintSheet>
        <article className="space-y-4">
          <div className="text-center border-b-2 border-black pb-3">
            <h2 className="font-bold text-[16pt] tracking-wide">
              {t("rti.template.formA")}
            </h2>
            <p className="text-[10pt] italic">
              {t("rti.template.ruleCitation")}
            </p>
            <h3 className="font-bold text-[13pt] mt-1">
              {t("rti.template.formTitle")}
            </h3>
          </div>

          <div className="pt-2">
            <p className="font-bold text-[12pt]">{t("rti.template.toPIO")}</p>
            <p className="font-semibold text-[12pt] pl-4">
              {publicAuthority || "[Public Information Officer Office]"}
            </p>
            <p className="text-[11pt] pl-4">
              {address ? `${address}, Uttar Pradesh` : "Uttar Pradesh"}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12pt]">
            <p className="whitespace-pre-line leading-relaxed">
              {t("rti.template.applicantDetails", {
                name: applicantName || "____________________",
                address: address || "________________________________________",
              })}
            </p>

            <div className="whitespace-pre-line leading-relaxed">
              {t("rti.template.particulars", {
                subject: subjectText,
                details:
                  details ||
                  "1. Certified copy of Action Taken Report (ATR) on earlier complaint.\n2. Certified copies of Measurement Book (MB) entries and sanctioned estimates.\n3. Inspection of relevant project records.",
              })}
            </div>

            <p className="leading-relaxed">
              {t("rti.template.point4")}
            </p>

            <p className="leading-relaxed">
              {t("rti.template.declaration")}
            </p>
          </div>

          <div className="pt-8 flex justify-between items-end text-[12pt]">
            <div>
              <p>स्थान / Place: {districtParam || "UP"}</p>
              <p>दिनांक / Date: {formatDate(new Date().toISOString().split("T")[0], lang)}</p>
            </div>
            <div className="text-right">
              <p className="mb-12">आवेदक के हस्ताक्षर / Signature of Applicant</p>
              <p className="font-bold">{applicantName || "____________________"}</p>
            </div>
          </div>
        </article>
      </PrintSheet>
    </div>
  );
}

export default function RtiPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Loading...</div>}>
      <RtiContent />
    </Suspense>
  );
}
