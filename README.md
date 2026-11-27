# UP Civic Grievance Portal (`उत्तर प्रदेश जनहित समाधान`)

**Live Portal:** [up-civic-redressal.vercel.app](https://up-civic-redressal.vercel.app/)

An independent, bilingual (English / हिन्दी), mobile-first public redressal guide for residents of **Uttar Pradesh**. It helps citizens go directly from a **6-digit PIN code**, **village**, **development block**, or **town/city** to the exact responsible local officer, verified official phone numbers, a step-by-step statutory escalation ladder (including **SDM / Tehsil Samadhan Diwas**), and ready-to-submit formal complaints or **RTI Form-A** applications.

> **Disclaimer:** This is an unofficial civic utility built in the public interest. It is not affiliated with, endorsed by, or operated by the Government of Uttar Pradesh. Always confirm time-sensitive notices on official `.gov.in` / `.nic.in` portals.

---

## Why This Exists

Finding who actually handles a broken handpump, clogged drain, unlit street pole, damaged road, garbage pile, or delayed MGNREGA wage across Uttar Pradesh's districts often turns into dead ends—residents know who they voted for locally, not which administrative desk owns the budget and statutory timeline, nor whom to escalate to when nothing moves.

This portal bridges that gap with:
- **Location-first officer resolution** instead of guesswork across Gram Panchayats, Vikas Khands, Nagar Panchayats, Nagar Palika Parishads, Nagar Nigams, Cantonment Boards, and Development Authorities (NOIDA, GNIDA, YEIDA).
- **Verified official numbers only** compiled strictly from official `.gov.in` and `.nic.in` directories—never synthetic emails or placeholder phone numbers.
- **Complete browser-side privacy** for complaint letters and RTI drafts—no login, no account, and zero personal complaint text uploaded to a server.

---

## Verified Coverage Across Uttar Pradesh

| Administrative Layer | Coverage in Dataset |
| --- | --- |
| **Districts** | **75 / 75** UP districts |
| **Indexed Places** | **119,211** entries (`107,486` LGD Gram Panchayat/village records across `114,724` village entries, `860` blocks, and `3,627` towns/wards) |
| **PIN Codes** | **1,658** mapped UP PIN codes + 3-digit postal prefix fallback + live India Post API resolution (`/api/pincode`) |
| **Direct Official Phones** | `75/75` District Magistrates (DM), `74/75` CDOs, `290/351` SDMs across all `75` districts, `460/860` BDOs, `211/283` Urban Executive Officers (EO), `17/17` Nagar Nigam Commissioners, `24/75` DPROs |

Where an upstream district directory does not publish an individual contact (for example, individual Gram Panchayat Secretaries or unindexed block/DPRO lines), the UI states that gap transparently and routes citizens immediately to the verified supervising officer (**BDO**, **SDM**, **EO/Commissioner**, **CDO**, **DM**) and state helplines.

---

## Core Features

- **3-Step Location-First Wizard (`/find/`):** Enter a 6-digit UP PIN code (or choose a district), pick an optional issue and area type (`Village`, `Town`, `Nagar Nigam`, `Cantonment / Development Authority`, or `Not sure`), filter by Vikas Khand or PIN, and view ordered officers, verification dates, and a 1-click **30-second CM Helpline 1076 / Jansunwai summary**.
- **6 Guided Civic Issue Workflows (`/issue/[slug]/`):** End-to-end resolution for:
  1. `street-light` — Street light broken or missing
  2. `drain` — Drain overflow or waterlogging
  3. `road` — Road damaged or incomplete construction
  4. `handpump-water` — Broken handpump or unsafe drinking water
  5. `mgnrega` — MGNREGA work demand (Form-6) or wage delay *(includes urban rural-only safeguard)*
  6. `garbage` — Garbage dump or irregular waste collection
  Each workflow adapts dynamically between **Rural (GP / BDO / DPRO / SDM / CDO / DM)**, **Town (EO / SDM / DM)**, **Nagar Nigam (Municipal Commissioner / SDM / DM)**, and **Special Authorities**, linking directly to relevant portals (**CM Helpline 1076**, **Jansunwai IGRS**, **e-NagarSewa 1533**, **Jal Samadhan 1800-121-2164**, **Panchayati Raj UP**, **MGNREGA**).
- **Zero-Storage Complaint Letter Maker (`/letter/`):** Generates formal petitions citing the **UP Janhit Guarantee Act, 2011** with a tear-off acknowledgment counterfoil via pure CSS `@media print` (preserving Hindi Devanagari ligatures cleanly), optional **CC checkboxes** (SDM, CDO, DM), and copy-as-text output.
- **RTI Form-A Generator (`/rti/`):** Prefills issue-specific inspection/record requests (Measurement Book, muster rolls, ATRs, expenditure vouchers) citing the **Right to Information Act, 2005** and linking to `rtionline.up.gov.in`.
- **75-District Governance Directory (`/directory/`, `/directory/[district]/`):** Browsable district, tehsil (SDM), block (BDO), and urban local body directories with role filter pills, phone verification freshness badges, wrong-number reporting (`/report/`), and helpfulness voting.

---

## Tech Stack & Architecture

- **Framework & Runtime:** Next.js 15 (App Router), React 19, TypeScript, deployed on **Vercel** (`vercel.json` + App Router API handlers `/api/pincode`, `/api/feedback`, `/api/report`)
- **UI & Design System:** `@astryxdesign/core` (`@stylexjs/stylex`) paired with Tailwind CSS and custom archival/civic tokens (`themes/nl-classic/`)
- **Self-Hosted Typography:** Bundled `@fontsource/inter`, `@fontsource/source-serif-4`, `@fontsource/noto-sans-devanagari`, and `@fontsource/noto-serif-devanagari` (no runtime CDN font dependency)
- **Validation & Testing:** Zod schema & dataset quality validation (`scripts/validate-data.ts`), Vitest unit/route tests (`tests/*.test.ts`), and Playwright desktop + mobile Chromium E2E flows (`tests/e2e/flows.spec.ts`)
- **Privacy Architecture:** Feedback and wrong-number reports hash caller IPs with `DAILY_SALT` via SHA-256 (`app/api/feedback/route.ts`, `app/api/report/route.ts`) with per-IP rate limiting and optional Supabase persistence (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). See [DECISIONS.md](./DECISIONS.md) for full architectural notes.

---

## Project Structure

```text
app/                  Next.js App Router pages (/, /find, /issue/[slug], /letter, /rti, /directory, /report, /about) & /api/* routes
components/           UI primitives (SearchSelect, OfficerCard, LadderStep, Stepper, PrintSheet, Header, Footer)
lib/                  Officer resolver, urban/rural/authority issue routing, PIN lookup, saved area, i18n & Zod schemas
locales/              100% key-parity English (en.json) and Hindi (hi.json) translation dictionaries
public/data/          75 district officer JSONs, 75 LGD/ULB place files, state portals, issue ladders & UP PIN index
scripts/              Data harvesting, PDF KrutiDev/phone parser, transliteration helpers & strict dataset validator
tests/                Vitest unit/integration tests and Playwright end-to-end suites (Desktop & Mobile Chrome)
themes/               Compiled Astryx design theme tokens (nl-classic)
```

---

## Local Development & Verification

```bash
# Install dependencies
npm install

# Run local development server (http://localhost:3000)
npm run dev

# Validate all 75 district, place, PIN, state, and issue JSON datasets
npm run validate-data

# Run TypeScript check and Vitest unit/API tests
npx tsc --noEmit
npm test

# Build production Next.js bundle and run Playwright E2E suite (Chromium + Mobile Chrome)
npm run build
npm run test:e2e
```
