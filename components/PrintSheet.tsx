"use client";

import React from "react";

interface PrintSheetProps {
  children: React.ReactNode;
}

export default function PrintSheet({ children }: PrintSheetProps) {
  return (
    <div className="print-sheet bg-white p-6 md:p-10 border border-[#C8C3B8] rounded-[12px] shadow-[0_4px_20px_rgba(22,27,34,0.06)] text-black print:shadow-none print:border-0 print:rounded-none print:p-0">
      {children}
    </div>
  );
}
