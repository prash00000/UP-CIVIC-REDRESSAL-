"use client";

import React from "react";

interface PrintSheetProps {
  children: React.ReactNode;
}

export default function PrintSheet({ children }: PrintSheetProps) {
  return (
    <div className="print-sheet bg-white p-6 md:p-10 border-2 border-border rounded-card shadow-sm text-black">
      {children}
    </div>
  );
}
