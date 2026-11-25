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
      className={`w-full min-h-btn text-left p-4 rounded-[6px] border transition-colors flex items-center justify-between gap-4 focus-visible:outline-primary ${
        selected
          ? "border-[#154273] border-l-4 bg-[#EBF1F6]/60"
          : "border-border bg-surface hover:border-borderStrong hover:bg-mutedSurface/40"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div
            className={`w-9 h-9 rounded-[4px] border flex items-center justify-center flex-shrink-0 ${
              selected
                ? "bg-[#154273] border-[#154273] text-white"
                : "bg-bg border-border text-muted"
            }`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <span className="block font-semibold text-[16px] sm:text-[17px] text-text leading-snug">
            {title}
          </span>
          {subtitle && (
            <span className="block text-[14px] text-muted mt-0.5 leading-normal">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Architectural square check indicator */}
      <div
        className={`w-5 h-5 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${
          selected
            ? "border-[#154273] bg-[#154273] text-white"
            : "border-borderStrong bg-surface"
        }`}
        aria-hidden="true"
      >
        {selected && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
}
