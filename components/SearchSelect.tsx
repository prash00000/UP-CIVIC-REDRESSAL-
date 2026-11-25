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
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const selected = options.find((o) => o.id === value);
      if (selected) {
        setQuery(selected.label);
      }
    }
  }, [value, options]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) {
      return options.slice(0, 8);
    }
    const clean = query.trim().toLowerCase();
    const startsWithMatches: SearchOption[] = [];
    const includesMatches: SearchOption[] = [];

    for (const opt of options) {
      const matchTarget = (opt.searchValue || `${opt.label} ${opt.sublabel || ""}`).toLowerCase();
      if (matchTarget.startsWith(clean)) {
        startsWithMatches.push(opt);
      } else if (matchTarget.includes(clean)) {
        includesMatches.push(opt);
      }
      if (startsWithMatches.length + includesMatches.length >= 16) break;
    }

    return [...startsWithMatches, ...includesMatches].slice(0, 8);
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
    <div ref={containerRef} className="relative w-full">
      <label className="block text-[13px] font-bold uppercase tracking-[0.06em] text-muted mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          placeholder={placeholder || t("flow.searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-btn px-4 py-2.5 pr-10 bg-surface text-text text-[16px] border border-borderStrong rounded-[4px] focus:border-[#154273] focus-visible:outline-none transition-colors"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-40 w-full mt-1 bg-surface border border-borderStrong rounded-[4px] shadow-md max-h-64 overflow-y-auto divide-y divide-border"
        >
          {filtered.length === 0 ? (
            <li className="p-3.5 text-[15px] text-muted text-center">
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
                  className={`px-4 py-2.5 cursor-pointer text-left transition-colors ${
                    isHighlighted ? "bg-[#EBF1F6] text-[#154273] font-medium" : "text-text"
                  } ${isSelected ? "border-l-4 border-[#154273] pl-3 bg-[#EBF1F6]/60" : ""}`}
                >
                  <div className="text-[16px] font-medium leading-snug">{item.label}</div>
                  {item.sublabel && (
                    <div className="text-[13px] text-muted leading-tight mt-0.5">{item.sublabel}</div>
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
