"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function Footer() {
  const t = useT();

  return (
    <footer className="mt-auto bg-[#102338] text-[#C5D1DE] border-t-[3px] border-[#C84B16] py-10 px-4 sm:px-6 no-print">
      <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-7 space-y-2.5">
          <p className="font-editorial font-bold text-white text-[19px] tracking-[-0.01em]">
            Uttar Pradesh Civic Grievance Redressal Portal
          </p>
          <p className="text-[14px] max-w-[600px] text-[#B0C0D0] leading-relaxed">
            {t("footer.disclaimer")}
          </p>
          <p className="text-[12px] uppercase tracking-[0.08em] text-[#8FA4BA] pt-1">
            UP Janhit Guarantee Act, 2011 · RTI Act, 2005
          </p>
        </div>

        <div className="md:col-span-5 grid grid-cols-2 gap-4 text-[14px]">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8FA4BA] font-semibold">
              {t("nav.directory")}
            </p>
            <ul className="space-y-1.5 list-none p-0 m-0">
              <li>
                <Link href="/find/" className="text-[#E6EDF5] hover:text-white underline-offset-4 hover:underline">
                  {t("nav.find")}
                </Link>
              </li>
              <li>
                <Link href="/directory/" className="text-[#E6EDF5] hover:text-white underline-offset-4 hover:underline">
                  {t("nav.directory")}
                </Link>
              </li>
              <li>
                <Link href="/letter/" className="text-[#E6EDF5] hover:text-white underline-offset-4 hover:underline">
                  {t("nav.letter")}
                </Link>
              </li>
              <li>
                <Link href="/rti/" className="text-[#E6EDF5] hover:text-white underline-offset-4 hover:underline">
                  {t("nav.rti")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8FA4BA] font-semibold">
              {t("nav.about")}
            </p>
            <ul className="space-y-1.5 list-none p-0 m-0">
              <li>
                <Link href="/about/" className="text-[#E6EDF5] hover:text-white underline-offset-4 hover:underline">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href="/report/" className="text-[#E6EDF5] hover:text-white underline-offset-4 hover:underline">
                  {t("results.reportError")}
                </Link>
              </li>
              <li>
                <a
                  href="https://jansunwai.up.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F39C72] hover:text-[#FFBA99] font-medium inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  <span>Jansunwai Portal</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
