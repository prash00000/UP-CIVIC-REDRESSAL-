"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { useT, useLang, getLocalized, formatDate } from "@/lib/i18n";
import { DistrictData, Place, IssueSlug } from "@/lib/types";
import { loadDistrictData, loadDistrictsIndex, loadPlacesData } from "@/lib/data";
import PrintSheet from "@/components/PrintSheet";

const ISSUES_LIST: { slug: IssueSlug; labelKey: string }[] = [
  { slug: "street-light", labelKey: "issue.street-light" },
  { slug: "drain", labelKey: "issue.drain" },
  { slug: "road", labelKey: "issue.road" },
  { slug: "handpump-water", labelKey: "issue.handpump-water" },
  { slug: "mgnrega", labelKey: "issue.mgnrega" },
  { slug: "garbage", labelKey: "issue.garbage" },
];

function LetterContent() {
  const t = useT();
  const { lang } = useLang();
  const searchParams = useSearchParams();

  const districtParam = searchParams.get("district") || "";
  const placeParam = searchParams.get("place") || "";
  const issueParam = searchParams.get("issue") || "street-light";
  const officerParam = searchParams.get("officer") || "";

  const [applicantName, setApplicantName] = useState("");
  const [mobile, setMobile] = useState("");
  const [villageOrWard, setVillageOrWard] = useState("");
  const [localBody, setLocalBody] = useState("");
  const [blockOrTehsil, setBlockOrTehsil] = useState("");
  const [district, setDistrict] = useState(districtParam);
  const [issue, setIssue] = useState<IssueSlug>(
    (issueParam as IssueSlug) || "street-light"
  );
  const [locationDetails, setLocationDetails] = useState("");
  const [dateFirstNoticed, setDateFirstNoticed] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [earlierComplaint, setEarlierComplaint] = useState("");
  const [addressedTo, setAddressedTo] = useState(officerParam);

  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  // Load district and places data for prefilling
  useEffect(() => {
    if (districtParam) {
      Promise.all([
        loadDistrictData(districtParam),
        loadPlacesData(districtParam),
        loadDistrictsIndex(),
      ]).then(([d, p, idx]) => {
        setDistrictData(d);
        setPlaces(p);
        const meta = idx.find((entry) => entry.id === districtParam);
        if (meta) {
          setDistrict(getLocalized(meta, "name", lang));
        }
      });
    }
  }, [districtParam, lang]);

  // Prefill fields when place is loaded
  useEffect(() => {
    if (places.length > 0 && placeParam) {
      const pl = places.find((p) => p.id === placeParam);
      if (pl) {
        setVillageOrWard(getLocalized(pl, "name", lang));
        setLocalBody(pl.gp_id || pl.ulb_id || "");
        setBlockOrTehsil(pl.block_id || pl.tehsil_id || "");
      }
    }
  }, [places, placeParam, lang]);

  // Set default addressedTo if districtData is loaded
  useEffect(() => {
    if (districtData?.offices && districtData.offices.length > 0 && !addressedTo) {
      const defaultOff =
        districtData.offices.find((o) => o.role === "secretary") ||
        districtData.offices.find((o) => o.role === "bdo") ||
        districtData.offices.find((o) => o.role === "eo") ||
        districtData.offices[0];
      if (defaultOff) {
        setAddressedTo(getLocalized(defaultOff, "office_name", lang));
      }
    }
  }, [districtData, addressedTo, lang]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formattedDate = formatDate(dateFirstNoticed, lang);
  const issueName = t(`issue.${issue}`);
  const fullLocation = `${villageOrWard ? villageOrWard + ", " : ""}${
    blockOrTehsil ? blockOrTehsil + ", " : ""
  }${district || ""}`;

  return (
    <div className="max-w-[840px] mx-auto space-y-8">
      {/* Page Title (hidden on print) */}
      <div className="no-print space-y-2 border-b border-border pb-5">
        <h1 className="font-editorial text-[30px] sm:text-[36px] font-bold text-text">
          {t("letter.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed">
          {t("letter.subtitle")}
        </p>
      </div>

      {/* FORM INPUTS (hidden on print) */}
      <section aria-label="Letter Form" className="no-print">
        <Card padding={5} variant="default" elevation="none">
          <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.applicantName")} *
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
              {t("letter.mobile")} *
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.villageOrWard")} *
            </label>
            <input
              type="text"
              value={villageOrWard}
              onChange={(e) => setVillageOrWard(e.target.value)}
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.blockOrTehsil")} *
            </label>
            <input
              type="text"
              value={blockOrTehsil}
              onChange={(e) => setBlockOrTehsil(e.target.value)}
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.district")} *
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.issue")}
            </label>
            <select
              value={issue}
              onChange={(e) => setIssue(e.target.value as IssueSlug)}
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            >
              {ISSUES_LIST.map((it) => (
                <option key={it.slug} value={it.slug}>
                  {t(it.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.addressedTo")}
            </label>
            {districtData?.offices ? (
              <select
                value={addressedTo}
                onChange={(e) => setAddressedTo(e.target.value)}
                className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
              >
                {districtData.offices.map((off) => {
                  const offName = getLocalized(off, "office_name", lang);
                  return (
                    <option key={off.id} value={offName}>
                      {offName} ({t(`role.${off.role}`)})
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="text"
                value={addressedTo}
                onChange={(e) => setAddressedTo(e.target.value)}
                placeholder="e.g. Block Development Officer"
                className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-label font-semibold text-text mb-1">
            {t("letter.locationDetails")}
          </label>
          <input
            type="text"
            value={locationDetails}
            onChange={(e) => setLocationDetails(e.target.value)}
            placeholder="e.g. Near Primary School, Pole No. 4"
            className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.dateFirstNoticed")}
            </label>
            <input
              type="date"
              value={dateFirstNoticed}
              onChange={(e) => setDateFirstNoticed(e.target.value)}
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
          <div>
            <label className="block text-label font-semibold text-text mb-1">
              {t("letter.earlierComplaint")}
            </label>
            <input
              type="text"
              value={earlierComplaint}
              onChange={(e) => setEarlierComplaint(e.target.value)}
              placeholder="e.g. IGRS #1076-2026-X"
              className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="md"
            label={t("letter.print")}
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

      {/* RENDERED PRINT SHEET (Visible on screen and in print) */}
      <PrintSheet>
        {/* Main Petition Section */}
        <article className="space-y-4">
          <div>
            <p className="font-bold text-[16pt] text-black">
              {t("letter.template.to")}
            </p>
            <p className="font-semibold text-[13pt] text-black pl-4">
              {addressedTo || "[Competent Officer / सक्षम अधिकारी]"}
            </p>
            <p className="text-[12pt] text-black pl-4">
              {blockOrTehsil ? `${blockOrTehsil}, ` : ""}{district || "Uttar Pradesh"}
            </p>
          </div>

          <div className="font-bold text-[13pt] text-black border-y-2 border-black py-2 my-3">
            {t("letter.template.subject", { issue: issueName })}
          </div>

          <p className="font-semibold text-[12pt]">{t("letter.template.sir")}</p>

          <p className="text-[12pt] leading-relaxed">
            {t("letter.template.p1", {
              location: fullLocation || "[Location / स्थान]",
              issue: issueName,
              date: formattedDate || "[Date / दिनांक]",
            })}
          </p>

          {locationDetails && (
            <p className="text-[12pt] leading-relaxed">
              {t("letter.template.p2", { locationDetails })}
            </p>
          )}

          {earlierComplaint && (
            <p className="text-[12pt] leading-relaxed">
              {t("letter.template.prior", { priorRef: earlierComplaint })}
            </p>
          )}

          <p className="text-[12pt] leading-relaxed">
            {t("letter.template.p3")}
          </p>

          <p className="text-[12pt] font-semibold leading-relaxed">
            {t("letter.template.p4")}
          </p>

          <div className="pt-8 flex justify-between items-end">
            <div>
              <p className="text-[11pt]">दिनांक / Date: {formatDate(new Date().toISOString().split("T")[0], lang)}</p>
              <p className="text-[11pt]">स्थान / Place: {district || "UP"}</p>
            </div>
            <div className="text-right">
              <p className="text-[12pt] mb-12">{t("letter.template.closing")}</p>
              <p className="font-bold text-[12pt]">{applicantName || "____________________"}</p>
              <p className="text-[11pt]">मो. / Mobile: {mobile || "____________________"}</p>
            </div>
          </div>
        </article>

        {/* Perforated Divider for Acknowledgment Receipt */}
        <div className="my-8 border-b-2 border-dashed border-black relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-[10pt] uppercase font-bold tracking-wider">
            ✂️ {t("letter.receiptCopy")} (कार्यालय प्रति / पावती रसीद)
          </span>
        </div>

        {/* Acknowledgment Copy Section */}
        <section aria-label="Acknowledgment Copy" className="pt-2 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-[14pt] text-black">
              {t("letter.receiptCopy")}
            </h4>
            <span className="text-[11pt] font-semibold">
              डायरी सं. / Diary No: ____________
            </span>
          </div>

          <p className="text-[11pt] leading-normal">
            प्रार्थना पत्र प्राप्तकर्ता: {addressedTo || "सक्षम अधिकारी"}
          </p>
          <p className="text-[11pt] leading-normal">
            आवेदक का नाम: <strong>{applicantName || "__________"}</strong> | मोबाइल: <strong>{mobile || "__________"}</strong>
          </p>
          <p className="text-[11pt] leading-normal">
            स्थान व समस्या: {fullLocation} — {issueName}
          </p>

          <div className="pt-8 flex justify-between items-end text-[11pt]">
            <div>
              <p>प्राप्ति दिनांक: ______________</p>
            </div>
            <div className="text-right">
              <p className="mb-6">{t("letter.officeSeal")}</p>
              <p>प्राप्तकर्ता के हस्ताक्षर: ______________</p>
            </div>
          </div>
        </section>
      </PrintSheet>
    </div>
  );
}

export default function LetterPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Loading...</div>}>
      <LetterContent />
    </Suspense>
  );
}
