"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function Footer() {
  const t = useT();

  return (
    <footer className="mt-auto bg-[#0F172A] text-[#94A3B8] border-t border-[#1E293B] py-8 px-4 no-print">
      <div className="max-w-[1040px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="font-semibold text-white text-[16px] mb-1">
            Uttar Pradesh Civic Grievance Redressal Initiative
          </p>
          <p className="text-[14px] max-w-[640px] text-[#94A3B8] leading-relaxed">
            {t("footer.disclaimer")}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-[14px]">
          <Link href="/about/" className="text-[#E2E8F0] hover:text-white transition-colors underline-offset-4 hover:underline">
            {t("nav.about")}
          </Link>
          <Link href="/report/" className="text-[#E2E8F0] hover:text-white transition-colors underline-offset-4 hover:underline">
            {t("results.reportError")}
          </Link>
          <a
            href="https://jansunwai.up.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F59E0B] hover:text-[#FBBF24] font-medium transition-colors inline-flex items-center gap-1"
          >
            <span>Jansunwai Portal</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
