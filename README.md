# गाँव व नगर शिकायत (Gaon & Nagar Shikayat) — UP Authority & Grievance Helper
## Next-Gen Civic-Tech Utility for Local Governance, Spatial Jurisdiction & Administrative Accountability in Uttar Pradesh

**Gaon & Nagar Shikayat** is an advanced, privacy-first, bilingual civic utility designed to solve one of the most frustrating problems in Indian civic governance: **Jurisdictional Confusion & "Babu Ping-Pong"**.

In peri-urban, transitional, and rural Uttar Pradesh, citizens frequently send complaints to the wrong body (or authorities pass the buck between Gram Panchayat, Nagar Palika, Nagar Nigam, and PWD). This utility provides **Statewide S3WaaS Directory Harvesting (75 Districts, 344 Tehsils, 824 Blocks)**, the **Voter Ballot Test ("आप वोट किसको देते हैं?")**, and an **Instant Multi-Channel Dispatch Workflow** (Official Email, CUG Mobile Call, WhatsApp, UP IGRS Jansunwai deep-linking, and formal RTI Form 'A').

---

## 🌟 Architecture & Key Innovations

### 1. The Voter Ballot Test (अधिकार क्षेत्र का निर्णायक पैमाना)
Rather than relying on confusing municipal boundary GIS polygons that fail in peri-urban fringes, the platform asks the one question every citizen knows with 100% certainty:
- **"गाँव में ग्राम प्रधान के लिए वोट देते हैं?"** → **ग्राम पंचायत (Rural / Gram Panchayat)**
  - *सक्षम निवारण अधिकारी:* **खंड विकास अधिकारी (BDO)**
  - *पर्यवेक्षी अधिकारी (CC):* DPRO, CDO, DM
- **"कस्बे में चेयरमैन व सभासद के लिए वोट देते हैं?"** → **नगर पालिका / नगर पंचायत (Urban Local Body)**
  - *सक्षम निवारण अधिकारी:* **अधिशासी अधिकारी (Executive Officer - EO)**
  - *पर्यवेक्षी अधिकारी (CC):* उप-जिलाधिकारी (SDM), DM
- **"शहर में मेयर व पार्षद के लिए वोट देते हैं?"** → **नगर निगम (Municipal Corporation - 17 Nigams)**
  - *सक्षम निवारण अधिकारी:* **नगर आयुक्त (Municipal Commissioner)**
  - *पर्यवेक्षी अधिकारी (CC):* मंडलायुक्त (Divisional Commissioner), DM
- **"सड़क पर PWD / PMGSY का पत्थर या बोर्ड लगा है?"** → **विशेष सड़क खंड (PWD Override)**
  - *सक्षम निवारण अधिकारी:* **अधिशासी अभियंता (EE), लोक निर्माण विभाग (PWD)**

---

### 2. Live Statewide Authority Harvester Suite
Located in `scraper/`, this automated crawler suite harvests verified administrative contact directories directly from official National Informatics Centre (NIC) S3WaaS portals:
- [`scraper/harvest_statewide.js`](file:///C:/Users/prash/.gemini/antigravity/scratch/gaon-shikayat/scraper/harvest_statewide.js): Concurrency-pooled crawler targeting all 75 UP districts (`<district>.nic.in/directory/`, `whos-who/`, `about-district/`).
- [`scraper/compile_master_hierarchy.js`](file:///C:/Users/prash/.gemini/antigravity/scratch/gaon-shikayat/scraper/compile_master_hierarchy.js): Structured hierarchy mapping 75 districts, 344 tehsils, and 824 development blocks.
- [`scraper/build_unified_master.js`](file:///C:/Users/prash/.gemini/antigravity/scratch/gaon-shikayat/scraper/build_unified_master.js): Merges live scraped CUG numbers and emails with the administrative hierarchy, generating both JSON and client-side offline JS global.

#### Harvested Datasets:
- [`data/up_governance_master.js`](file:///C:/Users/prash/.gemini/antigravity/scratch/gaon-shikayat/data/up_governance_master.js): Standalone browser runtime global (`window.UP_GOVERNANCE_DATA`) with zero-latency offline resolution.
- [`data/up_governance_master.json`](file:///C:/Users/prash/.gemini/antigravity/scratch/gaon-shikayat/data/up_governance_master.json): Complete unified governance directory.
- [`data/up_governance_directory.json`](file:///C:/Users/prash/.gemini/antigravity/scratch/gaon-shikayat/data/up_governance_directory.json): 1,566 live-scraped authority records (DM, CDO, SDM, BDO, Tehsildar, EO, SP, PWD).

---

### 3. Live Verified Authority Card (सत्यापित अधिकारी संपर्क कार्ड)
As soon as a citizen selects their District and Block/Town:
- **पद व कार्यालय:** खंड विकास अधिकारी (BDO), ब्लॉक बछरावां, जनपद रायबरेली
- **CUG सरकारी मोबाइल:** `9454465404` (One-click "📲 कॉल करें" button)
- **आधिकारिक ईमेल:** `nrega.bcn@gmail.com`
- **स्वतः संलग्न प्रतिलिपि (Auto-CC):** CDO (`cdo.rae-up@gov.in`), DPRO (`dpro-rae@nic.in`), DM (`dmrae@nic.in`), SDM

---

### 4. 6-Way Practical Action Dispatch
1. **📧 सीधे शासकीय ईमेल (One-Click Official Email):**
   - Automatically populates `To:` with the responsible BDO/EO email.
   - Automatically populates `Cc:` with CDO, DPRO, and DM emails.
   - Pre-fills formal subject line and full legal petition text in Hindi.
2. **📲 CUG शासकीय मोबाइल कॉल:**
   - One-tap direct dial (`tel:9454465...`) to the government CUG number of the responsible officer.
3. **🌐 UP IGRS जनसुनवाई (Jansunwai Portal):**
   - 1-click clipboard copy of the structured grievance summary and direct launch of `https://jansunwai.up.nic.in`.
4. **💬 WhatsApp जन शिकायत:**
   - Formats the grievance summary for instant sharing via WhatsApp Web or mobile.
5. **🖨️ A4 शासकीय प्रारूप प्रिंट / PDF सेव:**
   - Formatted in accordance with Uttar Pradesh Government Secretariat memorandum standards with an **Office Receiving Stamp (कार्यालय पावती / डायरी संख्या रसीद)** stub.
6. **🔍 RTI आवेदन प्रारूप 'क' (Form-A Follow-up):**
   - Toggle to convert the complaint into a formal Right to Information application under Section 6(1) of RTI Act 2005, requesting measurement books (MB), muster rolls, and ATR.

---

### 5. Legal Anti-Ping-Pong Shield Clause
Every generated petition includes the statutory shield under the **UP Janhit Guarantee Adhiniyam 2011 (धारा 4)**:
> *"यदि उक्त स्थल अथवा समस्या आपके कार्यालय के क्षेत्राधिकार से परे किसी अन्य सहयोगी विभाग (जैसे PWD/जल निगम) के अंतर्गत आती है, तो उत्तर प्रदेश जनहित गारंटी अधिनियम 2011 की धारा 4 के तहत इसे निरस्त करने के स्थान पर कृपया स्वयं संबंधित विभाग को 48 घंटे के भीतर अग्रेषित (Forward) कर प्रार्थी को सूचित करने की कृपा करें।"*

---

### 6. Seamless Bilingual Engine (🇮🇳 हिंदी | English)
The application provides full bilingual switching with zero latency:
- **Sticky Top Bar Switcher**: One-tap toggle between `🇮🇳 हिंदी` and `English`.
- **Dynamic UI Localization**: Updates header, hero, 4-stage pipeline stepper, voter ballot cards, PWD override switch, interactive map controls, 6 grievance categories, form labels, input placeholders, verified authority card, action buttons, receiving stub, and 30-day escalation protocol.
- **Formal English Petition Generator**: Renders petitions adhering to high-standard Uttar Pradesh Secretariat and District Administration conventions (citing *Section 15 of UP Panchayati Raj Act 1947*, *Sections 7 & 8 of UP Municipalities Act 1916*, *Sections 114 & 561 of UP Municipal Corporation Act 1959*, and *Section 4 of UP Janhit Guarantee Act 2011*).
- **English RTI Form-A Follow-up**: Generates RTI applications in formal English with all 5 crucial demand points (daily ATR progress, technical inspection report, 3-year financial allocations, Measurement Book & muster rolls, and Citizen Charter guidelines).
- **Persistent Choice**: Automatically saves the user's language selection to `localStorage`.

---

## 🚀 How to Run the Project

This application is 100% client-side with zero build overhead:
1. **Directly in Browser**: Double-click [`index.html`](file:///C:/Users/prash/.gemini/antigravity/scratch/gaon-shikayat/index.html).
2. **Local Development Server**:
   ```powershell
   cd C:\Users\prash\.gemini\antigravity\scratch\gaon-shikayat
   node -e "const http=require('http'),fs=require('fs'),path=require('path');const dir='.';const s=http.createServer((req,res)=>{let reqPath=decodeURIComponent(req.url.split('?')[0]);if(reqPath==='/'||reqPath==='')reqPath='/index.html';const f=path.join(dir,reqPath);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('Not found');}else{let ct='text/html';if(f.endsWith('.css'))ct='text/css';else if(f.endsWith('.js'))ct='text/javascript';res.writeHead(200,{'Content-Type':ct+'; charset=utf-8'});res.end(d);}});});s.listen(8081,()=>console.log('Server running on http://localhost:8081'));"
   ```
3. **Re-run Full Crawler Suite**:
   ```powershell
   cd C:\Users\prash\.gemini\antigravity\scratch\gaon-shikayat\scraper
   node harvest_statewide.js
   node compile_master_hierarchy.js
   node build_unified_master.js
   ```

> [!TIP]
> **Active Workspace**:
> Set `C:\Users\prash\.gemini\antigravity\scratch\gaon-shikayat` as your active workspace in Antigravity.
