"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
      // Offline fallback
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-form mx-auto text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-success/10 text-success mx-auto flex items-center justify-center">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-[26px] font-bold text-text">
          {t("report.success")}
        </h1>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex min-h-btn px-6 py-2.5 bg-primary text-white font-bold rounded-btn"
          >
            {t("nav.home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-form mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] sm:text-[34px] font-extrabold text-text">
          {t("report.title")}
        </h1>
        <p className="text-[16px] text-muted leading-relaxed mt-1">
          {t("report.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-card bg-surface border border-border space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-btn bg-danger/10 border border-danger/20 text-danger text-[14px]">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-label font-semibold text-text mb-1">
            {t("report.officeLabel")}
          </label>
          <input
            type="text"
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
            placeholder="e.g. Office ID or designation"
            className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
          />
        </div>

        <div>
          <label className="block text-label font-semibold text-text mb-1">
            {t("report.reasonLabel")} *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as any)}
            className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
          >
            <option value="not_working">{t("report.reasonNotWorking")}</option>
            <option value="wrong_person">{t("report.reasonWrongPerson")}</option>
            <option value="moved">{t("report.reasonMoved")}</option>
            <option value="other">{t("report.reasonOther")}</option>
          </select>
        </div>

        <div>
          <label className="block text-label font-semibold text-text mb-1">
            {t("report.detailsLabel")}
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what happened when you tried calling..."
            className="w-full p-4 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none text-[15px]"
          />
        </div>

        {/* Contact is optional and MUST NOT be requested by default */}
        <div className="pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer text-[14px] text-text font-medium">
            <input
              type="checkbox"
              checked={showContactField}
              onChange={(e) => setShowContactField(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <span>Add optional contact for follow-up (optional)</span>
          </label>

          {showContactField && (
            <div className="mt-3">
              <label className="block text-label font-semibold text-text mb-1">
                {t("report.contactLabel")}
              </label>
              <input
                type="text"
                maxLength={100}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email or phone number"
                className="w-full min-h-btn px-4 py-2 border border-border rounded-btn bg-bg focus:border-primary focus-visible:outline-none"
              />
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-btn px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-btn transition-colors"
          >
            {submitting ? t("common.loading") : t("report.submitBtn")}
          </button>
        </div>
      </form>
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
