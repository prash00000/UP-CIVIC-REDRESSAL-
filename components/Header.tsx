"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";

const NAV_ITEMS = [
  { href: "/", key: "nav.home" },
  { href: "/find/", key: "nav.find" },
  { href: "/letter/", key: "nav.letter" },
  { href: "/rti/", key: "nav.rti" },
  { href: "/directory/", key: "nav.directory" },
  { href: "/about/", key: "nav.about" },
];

export default function Header() {
  const t = useT();
  const pathname = usePathname() || "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.replace(/\/$/, ""));
  };

  return (
    <header className="bg-surface border-b border-border no-print">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Dutch Civic Editorial Masthead */}
        <Link
          href="/"
          className="flex items-center gap-3 text-text no-underline hover:opacity-90 focus-visible:outline-primary group"
        >
          {/* Architectural Civic Colonnade Mark */}
          <div className="w-10 h-10 rounded-[4px] bg-[#154273] text-white flex items-center justify-center flex-shrink-0 border border-[#0F3156]">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
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
          <div className="border-l border-border pl-3">
            <span className="block font-editorial font-bold text-[18px] sm:text-[20px] leading-tight text-text tracking-[-0.01em]">
              UP Civic Grievance
            </span>
            <span className="block text-[12px] sm:text-[13px] font-medium text-muted leading-tight mt-0.5">
              उत्तर प्रदेश जनहित समाधान
            </span>
          </div>
        </Link>

        {/* Desktop Nav — classic Rijksoverheid underline indicator */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[15px] font-medium py-1.5 border-b-2 transition-colors ${
                  active
                    ? "text-[#154273] border-[#154273] font-semibold"
                    : "text-muted border-transparent hover:text-text hover:border-borderStrong"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <LanguageToggle />

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-h-touch min-w-[44px] inline-flex items-center justify-center p-2 text-text hover:bg-mutedSurface border border-border rounded-[4px]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-5 h-5"
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
          className="lg:hidden border-t border-border bg-bg px-4 py-3 flex flex-col divide-y divide-border"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`min-h-[44px] flex items-center justify-between text-[16px] py-2 px-2 ${
                  active ? "font-bold text-[#154273]" : "font-medium text-text hover:text-[#154273]"
                }`}
              >
                <span>{t(item.key)}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[#154273]" />}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
