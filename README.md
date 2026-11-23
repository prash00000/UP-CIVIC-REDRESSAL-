# UP Civic Grievance Helper (उ०प्र० नागरिक शिकायत सहायक)

An independent, privacy-first citizen facilitation tool designed for residents of Uttar Pradesh, India. It helps citizens identify the designated local administrative officer for civic issues (such as road damage, waterlogging, broken handpumps, or streetlights), draft a formal complaint letter in English or Hindi, and follow a clear 30-day escalation plan under the UP Janhit Guarantee Act, 2011.

---

## ⚠️ Important Independence Notice
This website is an **independent citizen tool** and is **NOT a government website**. It does not represent or act on behalf of the Government of Uttar Pradesh. All numbers and email contacts are compiled from publicly accessible district NIC portals (`{district}.nic.in`) and Vikas Bhawan directories.

---

## Key Features
1. **3-Step Complaint Letter Wizard**:
   - Step 1: Select civic problem (Road, Drainage, Drinking Water, Streetlight, Sanitation, Public Works).
   - Step 2: Choose location (Village, Town, or City area, District, Block/Town, Village/Locality).
   - Step 3: Review designated officer contact with verification status badge, draft formal letter, and take immediate action.
2. **First-Class Bilingual Architecture**:
   - Separate static URLs (`/` for English, `/hi/` for Hindi) for search indexing and fast loading.
   - 1-tap instant language toggle.
3. **Verified Officer Contact Cards**:
   - Clearly displays verification state: `Verified`, `From district website`, `Single source`, `Check before use` (for records older than 6 months), `Conflicting data`, or `Not verified yet`.
   - Direct `tel:` calling and `mailto:` email with pre-filled letter body.
   - "Report a wrong number" link on every card.
4. **Action Deck & Offline Utilities**:
   - One-tap letter copy to clipboard.
   - Dedicated print stylesheet (A4 format with official office receiving stub: Diary No, Date, Signature).
   - Browser-generated calendar reminders (`.ics`) for Day 7, Day 15, and Day 30 milestones.
   - WhatsApp letter share to personal contacts.
   - Direct link to official UP Jansunwai portal (`jansunwai.up.nic.in`).
5. **RTI Request Builder (`/rti/`)**:
   - Pre-formatted Right to Information application to inspect technical estimates, Measurement Books (MB), muster rolls, and expenditure vouchers.
6. **Privacy & DPDP Act 2023 Compliance**:
   - 100% in-browser processing. Zero server-side logging. Zero third-party trackers or cookies.
   - Unsent drafts are stored strictly in local `localStorage` with a "Clear my data" button.

---

## Project Structure
```
/
├─ src/
│  ├─ pages/          # Templates for static page generation
│  ├─ components/     # Reusable design system UI components
│  ├─ lib/
│  │  ├─ letter.js    # Pure function complaint letter builder
│  │  ├─ officers.js  # Officer resolution and status determination
│  │  ├─ ics.js       # Calendar reminder (.ics) generator
│  │  ├─ i18n.js      # Language detection and helpers
│  │  ├─ storage.js   # LocalStorage manager with error handling
│  │  └─ validate.js  # Field validation & XSS escaping
│  ├─ styles/
│  │  ├─ tokens.css   # WCAG 2.2 AA compliant CSS custom properties
│  │  ├─ base.css     # Typography & layout foundations
│  │  ├─ components.css # Buttons, tiles, stepper, badges, cards, timeline
│  │  └─ print.css    # A4 printable letter stylesheet with receiving stub
│  └─ i18n/
│     ├─ en.json      # English translations dictionary
│     └─ hi.json      # Hindi translations dictionary
├─ public/
│  ├─ data/           # blocks.json and lookup/*.json
│  ├─ fonts/          # Self-hosted woff2 font files
│  ├─ icons/          # PWA icons
│  ├─ manifest.webmanifest # Web App Manifest
│  └─ sw.js           # Service worker (stale-while-revalidate offline caching)
├─ content/
│  └─ claims.json     # Verified legal & procedural claims with source URLs
├─ scripts/
│  ├─ build_data.js   # Compiles blocks.json and district lookup files
│  └─ build_pages.js  # Static site generator for all 162+ HTML pages
├─ tests/
│  ├─ unit.test.js    # Unit tests (letter builder, validators, ics, officers)
│  └─ acceptance.test.js # Acceptance test checking banned words & compliance
├─ _headers           # Netlify strict CSP and security headers
├─ _redirects         # Netlify clean URL rules & 404 routing
├─ netlify.toml       # Netlify deployment configuration
└─ package.json
```

---

## How to Build and Run Locally

### Requirements
- Node.js v18 or higher (no external npm dependencies required).

### Commands
1. **Compile Data & Generate Static Pages**:
   ```bash
   node scripts/build_data.js
   node scripts/build_pages.js
   ```
   Or via npm:
   ```bash
   npm run build
   ```

2. **Run Unit & Acceptance Tests**:
   ```bash
   npm test
   ```

3. **Serve Locally**:
   You can serve the static directory using any local web server:
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```

---

## How to Replace or Update Officer Data
1. District and block hierarchies are stored in `public/data/blocks.json`.
2. Individual officer lookups per district reside in `public/data/lookup/{district-slug}.json`.
3. Keys are formatted as `district|block|designation` in lowercase (e.g. `raebareli|bachhrawan|bdo` or `agra|_district|dm`).
4. To refresh data, update the lookup JSON files with new verified phone numbers, emails, checked dates (`YYYY-MM-DD`), and source links, then re-run `node scripts/build_pages.js`.

---

## Deployment
Configured for automated continuous deployment to Netlify:
- Target: `civic-grievance-up.netlify.app`
- Publish directory: `.`
- Build command: `node scripts/build_data.js && node scripts/build_pages.js`
