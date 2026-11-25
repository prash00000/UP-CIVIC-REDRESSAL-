"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { useT } from "@/lib/i18n";

function ReportContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const officeParam = searchParams.get("office") || "";

  const [officeId, setOfficeId] = useState(officeParam);
  const [reason, setReason] = useState<"not_working" | "wrong_person" | "moved" | "other">("not_working");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [showContactField, setShowContactField] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          office_id: officeId || undefined,
          reason,
          details: details.trim() || undefined,
          contact: showContactField && contact.trim() ? contact.trim() : undefined,
        }),
      });

      if (res.status === 204 || res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || t("common.error"));
      }
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-form mx-auto text-center py-12 space-y-5">
        <div className="w-14 h-14 rounded-[6px] bg-[#ECF3EE] border border-[#245937]/30 text-[#245937] mx-auto flex items-center justify-center">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-editorial text-[28px] font-bold text-text">
          {t("report.success")}
        </h1>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-btn px-6 py-2.5 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[4px]"
          >
            {t("nav.home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-form mx-auto space-y-6">
      <div className="border-b border-border pb-4 space-y-1">
        <h1 className="font-editorial text-[30px] sm:text-[36px] font-bold text-text">
          {t("report.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed">
          {t("report.subtitle")}
        </p>
      </div>

      <Card padding={5} variant="default" elevation="none">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <Banner status="error" container="card" title={errorMsg} />
          )}

          <div>
            <label className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5">
              {t("report.officeLabel")}
            </label>
            <input
              type="text"
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              placeholder="e.g. Office ID or designation"
              className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-[4px] bg-bg focus:border-[#154273] focus-visible:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5">
              {t("report.reasonLabel")} *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-[4px] bg-bg focus:border-[#154273] focus-visible:outline-none"
            >
              <option value="not_working">{t("report.reasonNotWorking")}</option>
              <option value="wrong_person">{t("report.reasonWrongPerson")}</option>
              <option value="moved">{t("report.reasonMoved")}</option>
              <option value="other">{t("report.reasonOther")}</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5">
              {t("report.detailsLabel")}
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what happened when you tried calling..."
              className="w-full p-4 border border-borderStrong rounded-[4px] bg-bg focus:border-[#154273] focus-visible:outline-none text-[15px]"
            />
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-[14px] text-text font-medium">
              <input
                type="checkbox"
                checked={showContactField}
                onChange={(e) => setShowContactField(e.target.checked)}
                className="w-4 h-4 rounded text-[#154273] focus:ring-[#154273]"
              />
              <span>Add optional contact for follow-up (optional)</span>
            </label>

            {showContactField && (
              <div className="mt-3">
                <label className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5">
                  {t("report.contactLabel")}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or phone number"
                  className="w-full min-h-btn px-4 py-2 border border-borderStrong rounded-[4px] bg-bg focus:border-[#154273] focus-visible:outline-none"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              isDisabled={submitting}
              label={submitting ? t("common.loading") : t("report.submitBtn")}
            />
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
