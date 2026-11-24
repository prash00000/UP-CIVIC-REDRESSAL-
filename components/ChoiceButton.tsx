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
      className={`w-full min-h-btn text-left p-4 rounded-card border-2 transition-all flex items-center justify-between gap-4 focus-visible:outline-primary ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-bg hover:border-slate-300 hover:bg-surface"
      }`}
    >
      <div className="flex items-center gap-3.5">
        {icon && (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              selected ? "bg-primary text-white" : "bg-surface text-muted"
            }`}
          >
            {icon}
          </div>
        )}
        <div>
          <span className="block font-semibold text-[17px] sm:text-[18px] text-text leading-snug">
            {title}
          </span>
          {subtitle && (
            <span className="block text-[14px] sm:text-[15px] text-muted mt-0.5 leading-normal">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Check Icon if selected */}
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected
            ? "border-primary bg-primary text-white"
            : "border-slate-300 bg-white"
        }`}
        aria-hidden="true"
      >
        {selected && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
}
