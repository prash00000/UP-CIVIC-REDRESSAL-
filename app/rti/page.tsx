"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { useT, useLang, getLocalized, formatDate, Lang } from "@/lib/i18n";
import { DistrictData, DistrictIndexEntry, IssueSlug, PincodeMap, Place } from "@/lib/types";
import { loadDistrictData, loadDistrictsIndex, loadPlacesData, loadPincodes } from "@/lib/data";
import { usePincodeLookup } from "@/lib/usePincodeLookup";
import { resolveOfficers } from "@/lib/resolver";
import { getPrimaryOfficerForIssue } from "@/lib/issue-routing";
import { formatPlaceBlockAndTehsil, formatPlaceSublabel } from "@/lib/place-display";
import { readSavedArea } from "@/lib/saved-area";
import SearchSelect, { SearchOption } from "@/components/SearchSelect";
import PrintSheet from "@/components/PrintSheet";

function getIssueRtiPrefill(issueSlug: string, lang: Lang): string {
  const hiMap: Record<string, string> = {
    "street-light":
      "1. संबंधित ग्राम/वार्ड में स्ट्रीट लाइट की स्थापना, मरम्मत व रखरखाव कार्य आदेश एवं भुगतान वाउचर की प्रमाणित प्रति।\n2. खराब स्ट्रीट लाइटों की पूर्व शिकायत पर की गई कार्रवाई की आख्या (ATR)।",
    drain:
      "1. संबंधित क्षेत्र में नाली सफाई, जल निकासी निर्माण कार्य की तकनीकी स्वीकृति व माप पुस्तिका (MB) की प्रति।\n2. स्वच्छता व जलभराव निवारण हेतु स्वीकृत एवं व्यय धनराशि का विवरण।",
    road:
      "1. संबंधित सड़क निर्माण/मरम्मत कार्य की तकनीकी स्वीकृति, प्राक्कलन व माप पुस्तिका (MB) की प्रमाणित प्रति।\n2. कार्यदायी संस्था को किए गए भुगतान एवं गुणवत्ता जांच आख्या की प्रति।",
    "handpump-water":
      "1. ग्राम/वार्ड में सार्वजनिक हैंडपंप री-बोर एवं मरम्मत पंजिका तथा स्वीकृत व्यय वाउचर की प्रमाणित प्रति।\n2. पेयजल गुणवत्ता जांच रिपोर्ट एवं लंबित शिकायतों की कार्रवाई आख्या।",
    mgnrega:
      "1. मनरेगा अंतर्गत प्रपत्र-6 (काम की मांग) प्राप्ति पंजिका एवं मस्टर रोल (Muster Roll) की प्रमाणित प्रति।\n2. मजदूरी भुगतान (FTO) व विलंबित भुगतान पर बेरोजगारी भत्ते की स्थिति का विवरण।",
    garbage:
      "1. ग्राम/वार्ड में ठोस अपशिष्ट प्रबंधन, सफाई कर्मियों की तैनाती एवं कचरा वाहन लॉगबुक की प्रमाणित प्रति।\n2. स्वच्छता निधि से स्वीकृत एवं व्यय की गई धनराशि के वाउचर की प्रति।",
  };
  const enMap: Record<string, string> = {
    "street-light":
      "1. Certified copies of street-light installation/AMC work orders, billing vouchers, and repair logbook for the area.\n2. Action Taken Report (ATR) on earlier public complaints regarding non-functional lights.",
    drain:
      "1. Certified copies of drain cleaning/desilting roster, Measurement Book (MB) entries, and sanctioned works.\n2. Itemized sanitation fund utilization details and Action Taken Report (ATR) on waterlogging.",
    road:
      "1. Certified copies of road construction/repair technical sanction, cost estimate, and Measurement Book (MB) pages.\n2. Contractor payment vouchers and third-party quality inspection report.",
    "handpump-water":
      "1. Certified copy of public handpump installation/re-bore register and maintenance expenditure vouchers.\n2. Potable water testing report and Action Taken Report on defective handpumps.",
    mgnrega:
      "1. Certified copies of Form-6 (work demand) receipt register and relevant MGNREGA Muster Rolls.\n2. Status of Fund Transfer Orders (FTO), wage disbursement delays, and unemployment allowance.",
    garbage:
      "1. Certified copies of door-to-door waste collection roster, sanitation worker deployment log, and vehicle bills.\n2. Utilization vouchers of solid waste management funds and ATR on earlier complaints.",
  };
  if (lang === "hi") return hiMap[issueSlug] || "";
  return enMap[issueSlug] || "";
}

function RtiContent() {
  const t = useT();
  const { lang } = useLang();
  const searchParams = useSearchParams();

  const districtParam = searchParams.get("district") || "";
  const placeParam = searchParams.get("place") || "";
  const pincodeParam = searchParams.get("pincode") || "";
  const issueParam = searchParams.get("issue") || "";
  const officerParam = searchParams.get("officer") || "";

  const [applicantName, setApplicantName] = useState("");
  const [address, setAddress] = useState("");
  const [publicAuthority, setPublicAuthority] = useState(
    officerParam ? `Public Information Officer (PIO), ${officerParam}` : ""
  );
  const [manualAuthorityEdit, setManualAuthorityEdit] = useState(false);
  const [subjectKey, setSubjectKey] = useState("rti.subject1");
  const [details, setDetails] = useState(() => getIssueRtiPrefill(issueParam, "en"));
  const [manualDetailsEdit, setManualDetailsEdit] = useState(false);

  const [pinInput, setPinInput] = useState(pincodeParam);
  const [selectedDistId, setSelectedDistId] = useState(districtParam);
  const [selectedPlaceId, setSelectedPlaceId] = useState(placeParam);
  const [districtsIndex, setDistrictsIndex] = useState<DistrictIndexEntry[]>([]);
  const [pincodesMap, setPincodesMap] = useState<PincodeMap>({});
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [districtDisplay, setDistrictDisplay] = useState(districtParam);
  const [copied, setCopied] = useState(false);

  const pincodesLoadedRef = useRef(false);
  const lastAutoPinRef = useRef<string | null>(null);

  const ensurePincodesLoaded = useCallback(() => {
    if (pincodesLoadedRef.current) return;
    pincodesLoadedRef.current = true;
    loadPincodes().then(setPincodesMap);
  }, []);

  const pinState = usePincodeLookup(pinInput, pincodesMap);

  useEffect(() => {
    loadDistrictsIndex().then(setDistrictsIndex);
    if (pincodeParam && pincodeParam.replace(/\D/g, "").length >= 3) {
      ensurePincodesLoaded();
    }
    if (!districtParam && !placeParam && !pincodeParam) {
      const saved = readSavedArea();
      if (saved) {
        setSelectedDistId(saved.districtId);
        setSelectedPlaceId(saved.placeId === "district-hq" ? "" : saved.placeId);
        if (saved.pincode) {
          setPinInput(saved.pincode);
          ensurePincodesLoaded();
        }
      }
    }
  }, [districtParam, placeParam, pincodeParam, ensurePincodesLoaded]);

  // Keep issue-specific RTI questions localized until user manually edits details
  useEffect(() => {
    if (!manualDetailsEdit && issueParam) {
      const prefill = getIssueRtiPrefill(issueParam, lang);
      if (prefill) setDetails(prefill);
    }
  }, [issueParam, lang, manualDetailsEdit]);

  useEffect(() => {
    if (pinInput.length !== 6) {
      lastAutoPinRef.current = null;
      return;
    }
    if (pinState.matches.length === 1 && lastAutoPinRef.current !== pinInput) {
      lastAutoPinRef.current = pinInput;
      const matched = pinState.matches[0].district_id;
      if (!selectedDistId || selectedDistId !== matched) {
        setSelectedDistId(matched);
        setSelectedPlaceId("");
        setManualAuthorityEdit(false);
      }
    }
  }, [pinInput, pinState.matches, selectedDistId]);

  useEffect(() => {
    if (!selectedDistId) {
      setDistrictData(null);
      setPlaces([]);
      return;
    }
    Promise.all([
      loadDistrictData(selectedDistId),
      loadPlacesData(selectedDistId),
    ]).then(([d, p]) => {
      setDistrictData(d);
      setPlaces(p);
    });
  }, [selectedDistId]);

  useEffect(() => {
    if (!selectedDistId) return;
    const meta = districtsIndex.find((entry) => entry.id === selectedDistId);
    setDistrictDisplay(meta ? getLocalized(meta, "name", lang) : selectedDistId);
  }, [selectedDistId, districtsIndex, lang]);

  const districtOptions: SearchOption[] = useMemo(
    () =>
      districtsIndex.map((d) => ({
        id: d.id,
        label: getLocalized(d, "name", lang),
        sublabel: t("directory.division", { division: getLocalized(d, "division", lang) }),
        searchValue: `${d.name_en} ${d.name_hi}`,
      })),
    [districtsIndex, lang, t]
  );

  const placeOptions: SearchOption[] = useMemo(() => {
    const scoped =
      pinInput.length === 6 && places.some((p) => p.pincodes?.includes(pinInput))
        ? places.filter((p) => p.pincodes?.includes(pinInput))
        : places;
    return scoped.map((p) => ({
      id: p.id,
      label: getLocalized(p, "name", lang),
      sublabel: formatPlaceSublabel(p, lang),
      searchValue: `${p.name_en} ${p.name_hi} ${p.block_name_en || ""} ${p.block_name_hi || ""} ${p.block_id || ""} ${p.gp_id || ""} ${p.pincodes?.join(" ") || ""}`,
    }));
  }, [places, pinInput, lang]);

  useEffect(() => {
    const pioPrefix = lang === "hi" ? "जन सूचना अधिकारी (PIO), " : "Public Information Officer (PIO), ";
    if (places.length > 0 && selectedPlaceId) {
      const pl = places.find((p) => p.id === selectedPlaceId);
      if (pl) {
        const blockTehsil = formatPlaceBlockAndTehsil(pl, districtData, lang);
        setAddress(
          [getLocalized(pl, "name", lang), blockTehsil, districtDisplay].filter(Boolean).join(", ")
        );
        if (districtData && !manualAuthorityEdit) {
          const res = resolveOfficers(pl.local_body_type, selectedDistId, pl.id, districtData, places);
          const issueSlug = (issueParam || "street-light") as IssueSlug;
          const primary = getPrimaryOfficerForIssue(issueSlug, res);
          if (primary) {
            setPublicAuthority(`${pioPrefix}${getLocalized(primary.office, "office_name", lang)}`);
          }
        }
        return;
      }
    }

    if (districtData?.offices && districtData.offices.length > 0 && !manualAuthorityEdit) {
      const matchedFromParam = officerParam
        ? districtData.offices.find(
            (o) => o.office_name_en === officerParam || o.office_name_hi === officerParam
          )
        : undefined;
      const bdo = districtData.offices.find((o) => o.role === "bdo");
      const dpro = districtData.offices.find((o) => o.role === "dpro");
      const eo = districtData.offices.find((o) => o.role === "eo");
      const chosen = matchedFromParam || bdo || eo || dpro || districtData.offices[0];
      if (chosen) {
        setPublicAuthority(`${pioPrefix}${getLocalized(chosen, "office_name", lang)}`);
      }
    } else if (!districtData && officerParam && !manualAuthorityEdit) {
      setPublicAuthority(`${pioPrefix}${officerParam}`);
    }
  }, [places, selectedPlaceId, districtDisplay, districtData, selectedDistId, officerParam, issueParam, lang, manualAuthorityEdit]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const subjectText = t(subjectKey);
  const defaultDetails =
    details ||
    (lang === "hi"
      ? "1. पूर्व शिकायत पर की गई कार्रवाई की आख्या (ATR) की प्रमाणित प्रति।\n2. माप पुस्तिका (MB) व स्वीकृत प्राक्कलन की प्रमाणित प्रति।\n3. संबंधित अभिलेखों का निरीक्षण।"
      : "1. Certified copy of Action Taken Report (ATR) on earlier complaint.\n2. Certified copies of Measurement Book (MB) entries and sanctioned estimates.\n3. Inspection of relevant project records.");

  const handleCopyRtiText = async () => {
    const text = [
      `${t("rti.template.formA")} - ${t("rti.template.formTitle")}`,
      "",
      t("rti.template.toPIO"),
      publicAuthority || "[Public Information Officer Office]",
      address ? `${address}, Uttar Pradesh` : "Uttar Pradesh",
      "",
      t("rti.template.applicantDetails", {
        name: applicantName || "____________________",
        address: address || "____________________",
      }),
      t("rti.template.particulars", {
        subject: subjectText,
        details: defaultDetails,
      }),
      t("rti.template.point4"),
      t("rti.template.declaration"),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="max-w-[840px] mx-auto space-y-8">
      {/* Page Title */}
      <div className="no-print space-y-2 border-b border-border pb-5">
        <h1 className="font-editorial text-[30px] sm:text-[36px] font-bold text-text">
          {t("rti.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed">
          {t("rti.subtitle")}
        </p>
      </div>

      {/* FORM INPUTS */}
      <section aria-label="RTI Form" className="no-print space-y-5">
        <div className="p-4 rounded-[6px] bg-surface border border-border space-y-3 overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label htmlFor="rti-pin-input" className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted mb-2">
                {t("letter.pinQuickLookup")}
              </label>
              <input
                id="rti-pin-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onFocus={ensurePincodesLoaded}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                  if (clean.length >= 1) ensurePincodesLoaded();
                  if (clean.length < 6) lastAutoPinRef.current = null;
                  setPinInput(clean);
                }}
                placeholder="226001"
                className="w-full min-h-btn px-3.5 py-2.5 bg-bg text-text text-[16px] tabular-nums border border-borderStrong rounded-[4px] focus:border-[#154273] focus-visible:outline-none"
              />
            </div>

            <SearchSelect
              label={t("flow.selectDistrict")}
              options={districtOptions}
              value={selectedDistId || null}
              onSelect={(opt) => {
                if (pinInput && !pinState.matches.some((m) => m.district_id === opt.id)) {
                  setPinInput("");
                  lastAutoPinRef.current = null;
                }
                setSelectedDistId(opt.id);
                setSelectedPlaceId("");
                setPublicAuthority("");
                setManualAuthorityEdit(false);
              }}
            />

            {selectedDistId && places.length > 0 && (
              <SearchSelect
                label={t("letter.pickPlaceOptional")}
                options={placeOptions}
                value={selectedPlaceId || null}
                onSelect={(opt) => {
                  setManualAuthorityEdit(false);
                  setSelectedPlaceId(opt.id);
                }}
              />
            )}
          </div>

          {pinState.matches.length > 1 && (
            <Banner status="info" container="card" title={t("flow.pincodeMulti")}>
              <div className="flex flex-wrap gap-2 pt-1">
                {pinState.matches.map((m) => {
                  const meta = districtsIndex.find((d) => d.id === m.district_id);
                  return (
                    <Button
                      key={m.district_id}
                      type="button"
                      size="sm"
                      variant={selectedDistId === m.district_id ? "primary" : "secondary"}
                      label={meta ? getLocalized(meta, "name", lang) : m.district_id}
                      onClick={() => {
                        setSelectedDistId(m.district_id);
                        setSelectedPlaceId("");
                        setManualAuthorityEdit(false);
                      }}
                    />
                  );
                })}
              </div>
            </Banner>
          )}
        </div>

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
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="block text-label font-semibold text-text mb-1">
                  {t("rti.publicAuthority")} *
                </label>
                <input
                  type="text"
                  value={publicAuthority}
                  onChange={(e) => {
                    setManualAuthorityEdit(true);
                    setPublicAuthority(e.target.value);
                  }}
                  placeholder="e.g. PIO, Office of BDO"
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
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
                className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
              />
            </div>

            <div>
              <label className="block text-label font-semibold text-text mb-1">
                {t("rti.subject")}
              </label>
              <select
                value={subjectKey}
                onChange={(e) => setSubjectKey(e.target.value)}
                className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none"
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
                onChange={(e) => {
                  setManualDetailsEdit(true);
                  setDetails(e.target.value);
                }}
                placeholder="Specific questions, Measurement Book (MB) pages, sanctioned estimates, or dates..."
                className="w-full p-4 border border-borderStrong rounded-btn bg-bg focus:border-[#154273] focus-visible:outline-none text-[15px]"
              />
            </div>

            {/* Official UP RTI Rules 2015 Fee Schedule & Online Portal */}
            <Banner
              status="info"
              container="card"
              collapsible={false}
              title={t("rti.feeNotice")}
              description={t("rti.feeScheduleDetails")}
            >
              <div className="pt-2">
                <a
                  href="https://rtionline.up.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#154273] underline underline-offset-4 hover:text-[#0F3156]"
                >
                  <span>{t("rti.officialPortalLink")}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </Banner>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                label={copied ? t("common.copied") : t("common.copyText")}
                onClick={handleCopyRtiText}
              />
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
                details: defaultDetails,
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
              <p>
                {t("letter.placeLabel")}: {districtDisplay || districtParam || "Uttar Pradesh"}
              </p>
              <p>
                {t("letter.dateLabel")}: {formatDate(new Date().toISOString().split("T")[0], lang)}
              </p>
            </div>
            <div className="text-right">
              <p className="mb-12">{t("rti.signatureLabel")}</p>
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
