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
    <header className="bg-surface/95 backdrop-blur-sm border-b border-border no-print">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Clean Modern Civic Brand Masthead */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 text-text no-underline hover:opacity-90 focus-visible:outline-primary group min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[8px] bg-[#154273] text-white flex items-center justify-center flex-shrink-0 border border-[#0F3156] shadow-sm">
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
          <div className="min-w-0 sm:border-l sm:border-border sm:pl-3">
            <span className="block font-bold text-[15px] sm:text-[18px] leading-tight text-text tracking-[-0.02em] whitespace-nowrap">
              <span className="min-[440px]:hidden">UP Civic</span>
              <span className="hidden min-[440px]:inline">UP Civic Grievance</span>
            </span>
            <span className="hidden sm:block text-[12px] font-medium text-muted leading-tight mt-0.5 truncate">
              उत्तर प्रदेश जनहित समाधान
            </span>
          </div>
        </Link>

        {/* Desktop Nav — distinct pill highlights for active route */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-[14px] px-3 py-1.5 rounded-[8px] transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#EBF1F6] text-[#154273] font-semibold"
                    : "text-muted font-medium hover:text-text hover:bg-mutedSurface/70"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <LanguageToggle />

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 text-text hover:bg-mutedSurface border border-border rounded-[8px] transition-colors"
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
          className="lg:hidden border-t border-border bg-bg/95 px-4 py-3 flex flex-col gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`min-h-[44px] flex items-center justify-between text-[15px] py-2 px-3 rounded-[8px] transition-colors ${
                  active
                    ? "bg-[#EBF1F6] font-semibold text-[#154273]"
                    : "font-medium text-text hover:bg-surface hover:text-[#154273]"
                }`}
              >
                <span>{t(item.key)}</span>
                {active && <span className="w-2 h-2 rounded-full bg-[#154273]" />}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
