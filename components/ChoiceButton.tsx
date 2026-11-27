"use client";

import React from "react";

interface ChoiceButtonProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

export default function ChoiceButton({
  title,
  subtitle,
  selected = false,
  onClick,
  icon,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full min-h-[64px] text-left p-4 rounded-[12px] border flex items-center justify-between gap-4 focus-visible:outline-primary civic-card-interactive ${
        selected
          ? "border-[#154273] ring-1 ring-[#154273] bg-[#EBF1F6]/75"
          : "border-border bg-surface hover:bg-[#FAF9F6]"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div
            className={`w-10 h-10 rounded-[10px] border flex items-center justify-center flex-shrink-0 transition-colors ${
              selected
                ? "bg-[#154273] border-[#154273] text-white"
                : "bg-[#F6F5F0] border-border text-[#154273]"
            }`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <span className="block font-semibold text-[16px] text-text leading-snug">
            {title}
          </span>
          {subtitle && (
            <span className="block text-[13.5px] text-muted mt-0.5 leading-snug">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Clear selection indicator */}
      <div
        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
          selected
            ? "border-[#154273] bg-[#154273] text-white"
            : "border-borderStrong bg-surface"
        }`}
        aria-hidden="true"
      >
        {selected && (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
}
