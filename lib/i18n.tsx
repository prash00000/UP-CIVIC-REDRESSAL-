"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";

export type Lang = "en" | "hi";

type TranslationKey = keyof typeof en;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Precedence: ?lang= URL param > localStorage.lang > "en"
    let initialLang: Lang = "en";
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang");
      if (urlLang === "en" || urlLang === "hi") {
        initialLang = urlLang;
      } else {
        const stored = localStorage.getItem("lang");
        if (stored === "en" || stored === "hi") {
          initialLang = stored;
        }
      }
    }
    setLangState(initialLang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = initialLang;
      document.documentElement.classList.toggle("lang-hi", initialLang === "hi");
    }
    setIsInitialized(true);
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
      document.documentElement.lang = newLang;
      document.documentElement.classList.toggle("lang-hi", newLang === "hi");
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[lang] || translations.en;
      let text = dict[key];

      if (!text) {
        // Fallback to English
        text = translations.en[key];
      }

      if (!text) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[i18n] Missing translation key: "${key}"`);
        }
        return key;
      }

      if (params) {
        for (const [pKey, pVal] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
        }
      }

      return text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useLang must be used within an I18nProvider");
  }
  return { lang: context.lang, setLang: context.setLang };
}

export function useT(): (key: string, params?: Record<string, string | number>) => string {
  const context = useContext(I18nContext);
  if (!context) {
    // Safe fallback if called outside provider in unit tests
    return (key: string, params?: Record<string, string | number>) => {
      let text = (en as Record<string, string>)[key] || key;
      if (params) {
        for (const [pKey, pVal] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
        }
      }
      return text;
    };
  }
  return context.t;
}

/**
 * Format date in English (e.g., '24 Nov 2026') or Hindi ('24 नव॰ 2026')
 * MUST use Western digits (numberingSystem: "latn") in both languages.
 */
export function formatDate(isoDate: string | null | undefined, lang: Lang): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;

    const locale = lang === "hi" ? "hi-IN" : "en-IN";
    const formatter = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      numberingSystem: "latn",
    });
    return formatter.format(d);
  } catch {
    return isoDate;
  }
}

/**
 * Helper to get localized pair with fallback to English
 */
export function getLocalized<T extends Record<string, any>>(
  item: T | null | undefined,
  field: string,
  lang: Lang
): string {
  if (!item) return "";
  const hiVal = item[`${field}_hi`];
  const enVal = item[`${field}_en`];
  if (lang === "hi" && hiVal && String(hiVal).trim().length > 0) {
    return String(hiVal);
  }
  return enVal ? String(enVal) : "";
}
