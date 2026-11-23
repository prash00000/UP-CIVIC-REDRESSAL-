# Privacy Architecture & DPDP Act 2023 Compliance

## 1. Zero Citizen PII Retention
- Citizen names, phone numbers, addresses, and letter details are held strictly in browser JavaScript memory.
- `localStorage` drafts are stored per-device and can be cleared instantly via the "Clear my data" button.
- No analytics or telemetry tracks keystrokes, form inputs, or generated letters.

## 2. Anonymous Report Protections
- `POST /api/v1/reports` stores only: `office_id`, `kind`, optional 300-char note, and `reporter_hash`.
- `reporter_hash = sha256(ip + user_agent + daily_salt)`. Daily salt is purged every 24 hours, making retrospective IP identification impossible.
- Reports are automatically purged 180 days after resolution.

## 3. Official CUG Directory Policy
- Only designated official CUG (Closed User Group) numbers and government emails published on district portals (`.nic.in` / `.gov.in`) are indexed.
- No personal phone numbers or residential addresses are collected.
- Immediate takedown or correction requests are processed within 7 days via `support@upcivic.in`.
