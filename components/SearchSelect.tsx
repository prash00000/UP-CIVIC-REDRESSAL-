"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { useT } from "@/lib/i18n";

export interface SearchOption {
  id: string;
  label: string;
  sublabel?: string;
  searchValue?: string;
}

interface SearchSelectProps {
  label: string;
  placeholder?: string;
  options: SearchOption[];
  value?: string | null;
  onSelect: (option: SearchOption) => void;
  autoFocus?: boolean;
}

export default function SearchSelect({
  label,
  placeholder,
  options,
  value,
  onSelect,
  autoFocus = false,
}: SearchSelectProps) {
  const t = useT();
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value) {
      const selected = options.find((o) => o.id === value);
      if (selected) {
        setQuery(selected.label);
      }
    } else if (prevValueRef.current) {
      setQuery("");
    }
    prevValueRef.current = value;
  }, [value, options]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) {
      return options.slice(0, 20);
    }
    const clean = query.trim().toLowerCase();
    const labelStarts: SearchOption[] = [];
    const targetStarts: SearchOption[] = [];
    const includesMatches: SearchOption[] = [];

    for (const opt of options) {
      const labelLower = opt.label.toLowerCase();
      const matchTarget = (opt.searchValue || `${opt.label} ${opt.sublabel || ""}`).toLowerCase();
      if (labelLower.startsWith(clean)) {
        labelStarts.push(opt);
      } else if (matchTarget.startsWith(clean)) {
        targetStarts.push(opt);
      } else if (includesMatches.length < 40 && matchTarget.includes(clean)) {
        includesMatches.push(opt);
      }
    }

    return [...labelStarts, ...targetStarts, ...includesMatches].slice(0, 40);
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightedIndex]) {
        const chosen = filtered[highlightedIndex];
        onSelect(chosen);
        setQuery(chosen.label);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full scroll-mt-24 ${isOpen ? "z-[70]" : "z-10"}`}>
      <label
        htmlFor={inputId}
        className="block text-[12px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={placeholder || t("flow.searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[46px] px-3.5 py-2.5 pr-16 bg-surface text-text text-[16px] border border-[#A8A295] rounded-[8px] shadow-[0_1px_2px_rgba(22,27,34,0.03)] focus:border-[#154273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154273]/25 transition-colors"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              aria-label={t("flow.pincodeClear")}
              onClick={() => {
                setQuery("");
                setIsOpen(true);
                setHighlightedIndex(0);
                inputRef.current?.focus();
              }}
              className="w-6 h-6 rounded-full inline-flex items-center justify-center text-muted hover:text-text hover:bg-mutedSurface text-[12px] transition-colors"
            >
              ✕
            </button>
          )}
          <div className="text-muted pointer-events-none px-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-[75] w-full mt-1.5 bg-surface border border-[#A8A295] rounded-[10px] shadow-[0_12px_28px_rgba(22,27,34,0.14)] max-h-64 overflow-y-auto divide-y divide-border"
        >
          {options.length > filtered.length && (
            <li className="px-3.5 py-1.5 text-[12px] font-medium text-muted bg-[#F6F5F0] tabular-nums">
              {t("flow.showingTop", { shown: filtered.length, total: options.length })}
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="p-4 text-[15px] text-muted text-center">
              {t("flow.noMatch")}
            </li>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = item.id === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(item);
                    setQuery(item.label);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3.5 py-2.5 cursor-pointer text-left transition-colors flex items-center justify-between gap-2 ${
                    isHighlighted ? "bg-[#EBF1F6] text-[#154273]" : "text-text"
                  } ${isSelected ? "border-l-[3px] border-[#154273] bg-[#EBF1F6]/65" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold leading-snug truncate">{item.label}</div>
                    {item.sublabel && (
                      <div className="text-[13px] text-muted leading-tight mt-0.5 truncate">{item.sublabel}</div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[#154273] font-bold text-[13px] flex-shrink-0" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
