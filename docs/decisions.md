# Architecture Decisions Record (ADR)

## ADR-001: Offline-First Static Snapshots for Citizen Experience
- **Context**: Citizens across Uttar Pradesh often access the portal from low-end mobile devices over patchy 2G/3G/4G connections.
- **Decision**: All citizen grievance paths (location selection, officer directory, complaint letter building) are compiled into static HTML and JSON snapshots cached by CDN and Service Worker.
- **Consequence**: Zero latency, 100% offline functionality, and mathematical impossibility of citizen PII leakage.

## ADR-002: Client-Side PIN Code Detection
- **Context**: Citizens frequently do not know their administrative development block or correct district nomenclature.
- **Decision**: Shard the official India Post directory (GODL-India) by 3-digit prefix (`public/data/pincode/{prefix}.json`). Perform 100% in-browser lookups.
- **Consequence**: Zero network requests to third-party APIs; instant auto-selection of district and locality suggestions.

## ADR-003: Privacy-Preserving Anonymous Reports
- **Context**: Citizens need to flag incorrect CUG numbers or non-functional emails.
- **Decision**: Require client-side proof-of-work (PoW) hash puzzle (~0.3s) and calculate daily salted reporter hashes `sha256(ip + ua + daily_salt)`.
- **Consequence**: Defeats spam bots without capturing personal citizen information or using intrusive third-party captchas (e.g. reCAPTCHA).

## ADR-004: Pure In-Browser PDF/Print Formatting
- **Context**: Official offices require a formal receiving stub with Diary No., Date, and Signature.
- **Decision**: Rely on browser print-to-PDF with dedicated A4 CSS media queries. No server-side PDF generation.
- **Consequence**: Avoids sending personal letter text to backend rendering servers, while preserving correct Devanagari Unicode glyph shaping.
