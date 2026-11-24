"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";

export default function Header() {
  const t = useT();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-bg border-b border-border no-print">
      <div className="max-w-[1040px] mx-auto px-4 h-18 py-3 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-text no-underline hover:opacity-90 focus-visible:outline-primary"
        >
          {/* Government / Pillar SVG Icon */}
          <div className="w-10 h-10 rounded-btn bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="21" x2="21" y2="21" />
              <line x1="6" y1="21" x2="6" y2="10" />
              <line x1="10" y1="21" x2="10" y2="10" />
              <line x1="14" y1="21" x2="14" y2="10" />
              <line x1="18" y1="21" x2="18" y2="10" />
              <polygon points="12 3 2 10 22 10 12 3" />
            </svg>
          </div>
          <div>
            <span className="block font-bold text-[18px] sm:text-[20px] leading-tight text-text">
              UP Civic Grievance
            </span>
            <span className="block text-[12px] sm:text-[13px] font-medium text-muted leading-tight">
              उत्तर प्रदेश जनहित समाधान
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-[16px] font-medium text-muted hover:text-primary transition-colors py-1"
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/find/"
            className="text-[16px] font-medium text-muted hover:text-primary transition-colors py-1"
          >
            {t("nav.find")}
          </Link>
          <Link
            href="/letter/"
            className="text-[16px] font-medium text-muted hover:text-primary transition-colors py-1"
          >
            {t("nav.letter")}
          </Link>
          <Link
            href="/rti/"
            className="text-[16px] font-medium text-muted hover:text-primary transition-colors py-1"
          >
            {t("nav.rti")}
          </Link>
          <Link
            href="/directory/"
            className="text-[16px] font-medium text-muted hover:text-primary transition-colors py-1"
          >
            {t("nav.directory")}
          </Link>
          <Link
            href="/about/"
            className="text-[16px] font-medium text-muted hover:text-primary transition-colors py-1"
          >
            {t("nav.about")}
          </Link>
        </nav>

        {/* Right Section: Language Toggle + Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <LanguageToggle />

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted hover:text-text focus-visible:outline-primary rounded-btn"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-2"
        >
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[16px] font-medium text-text hover:text-primary px-2"
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/find/"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[16px] font-medium text-text hover:text-primary px-2"
          >
            {t("nav.find")}
          </Link>
          <Link
            href="/letter/"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[16px] font-medium text-text hover:text-primary px-2"
          >
            {t("nav.letter")}
          </Link>
          <Link
            href="/rti/"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[16px] font-medium text-text hover:text-primary px-2"
          >
            {t("nav.rti")}
          </Link>
          <Link
            href="/directory/"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[16px] font-medium text-text hover:text-primary px-2"
          >
            {t("nav.directory")}
          </Link>
          <Link
            href="/about/"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[16px] font-medium text-text hover:text-primary px-2"
          >
            {t("nav.about")}
          </Link>
        </nav>
      )}
    </header>
  );
}
