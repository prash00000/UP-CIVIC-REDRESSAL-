# Project Architecture & Decisions Log (`DECISIONS.md`)

This log records architectural choices and resolutions to unspecified or edge-case items as per Rule 0 of the Master Build Guide.

---

## 1. Core Framework & Export
- **Decision:** Next.js 14 App Router with `output: "export"`.
- **Reason:** Guarantees static HTML/JS generation for Netlify hosting. Zero server cold-start, 100% CDN cached.

## 2. Internationalization (i18n) Strategy
- **Decision:** Custom zero-dependency React context (`lib/i18n.ts`) reading strictly from `locales/en.json` and `locales/hi.json`.
- **Precedence Order:** `?lang=` URL parameter > `localStorage.getItem("lang")` > `"en"`.
- **Digit Display:** Western numerals (`0-9`) used uniformly across Hindi and English for phone numbers, dates, PIN codes, and legislative act years as per standard Indian administrative conventions and section 5.1.
- **Date Formatting:** `Intl.DateTimeFormat` with `numberingSystem: "latn"`, formatting `en-IN` (e.g. "24 Nov 2026") and `hi-IN` (e.g. "24 नव॰ 2026").
- **Font Height:** Dynamic CSS class on `html[lang="hi"]` enforcing line-height `1.6` for Hindi and `1.5` for English.

## 3. Font Loading & Offline Capability
- **Decision:** Self-hosted / bundled `@fontsource/inter` and `@fontsource/noto-sans-devanagari` with `font-display: swap` instead of external Google Fonts CDN.
- **Reason:** Guarantees 0ms external network blocking, improves privacy, and functions on restricted mobile networks.

## 4. PDF Generation & Printing
- **Decision:** Pure CSS `@media print` with an A4 print sheet (`PrintSheet.tsx`), explicitly avoiding `jsPDF` or `html2pdf.js`.
- **Reason:** Client-side canvas/PDF libraries routinely mangle complex Devanagari ligatures (matras and conjunct consonants) in Hindi. Modern native browser print dialog preserves vector text and accurate typography.

## 5. Typeahead Search Algorithm
- **Decision:** Case-insensitive string search prioritizing `startsWith`, then falling back to `includes`.
- **Reason:** Complies strictly with Section 3 ("No library. Plain filter on lowercase startsWith then includes"). Operates in sub-millisecond time even on low-end Android mobile devices.

## 6. Feedback & Error Reporting Privacy (Netlify Functions)
- **Decision:** IP addresses are salted with `DAILY_SALT` and hashed using SHA-256 before insertion. The raw IP is NEVER stored or logged.
- **Rate Limiting:** Enforced via `ip_hash` window query in Supabase / in-memory fallback.

## 7. RTI Fees & Time Limits
- **Decision:** In accordance with Section 7.6, no hardcoded fee is displayed. UI explicitly displays: *"Check the fee and format on the official site"*, noting `[VERIFY: UP RTI Rules]` in source comments.
- **Time Limits:** Time limits are only rendered if supported by an explicit official `time_limit_source_url`.
