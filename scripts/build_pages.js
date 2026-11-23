const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const blocksPath = path.join(baseDir, 'public', 'data', 'blocks.json');
const blocksData = JSON.parse(fs.readFileSync(blocksPath, 'utf8'));

const enDict = JSON.parse(fs.readFileSync(path.join(baseDir, 'src', 'i18n', 'en.json'), 'utf8'));
const hiDict = JSON.parse(fs.readFileSync(path.join(baseDir, 'src', 'i18n', 'hi.json'), 'utf8'));

function getDict(lang) {
  return lang === 'hi' ? hiDict : enDict;
}

function renderNoticeBanner(lang) {
  const isHi = lang === 'hi';
  const text = isHi ? hiDict.independent_banner : enDict.independent_banner;
  return `
  <div class="notice-banner" role="note" aria-label="${isHi ? 'स्वतंत्रता घोषणा' : 'Independence Notice'}">
    <div class="container notice-banner-inner">
      <span class="notice-banner-icon" aria-hidden="true">ℹ️</span>
      <span>${text}</span>
    </div>
  </div>`;
}

function renderHeader(lang, activeNav = 'home', altUrl = '') {
  const d = getDict(lang);
  const isHi = lang === 'hi';
  const homeHref = isHi ? '/hi/' : '/';
  const officersHref = isHi ? '/hi/officers/' : '/officers/';
  const rtiHref = isHi ? '/hi/rti/' : '/rti/';
  const followUpHref = isHi ? '/hi/follow-up/' : '/follow-up/';
  const aboutHref = isHi ? '/hi/about/' : '/about/';
  const privacyHref = isHi ? '/hi/privacy/' : '/privacy/';

  const targetAlt = altUrl || (isHi ? '/' : '/hi/');

  return `
  ${renderNoticeBanner(lang)}
  <header class="site-header" role="banner">
    <div class="container">
      <div class="header-inner">
        <a href="${homeHref}" class="brand">
          <span class="brand-title">${d.site_title}</span>
          <span class="brand-subtitle">${d.site_subtitle}</span>
        </a>
        <div class="header-actions">
          <a href="tel:1076" class="btn btn-sm btn-call-1076" aria-label="${d.call_1076_aria}">
            📞 ${d.call_1076}
          </a>
          <a href="${targetAlt}" class="btn btn-sm btn-secondary" aria-label="${d.lang_toggle_aria}">
            🌐 ${d.lang_toggle}
          </a>
          <label for="themeToggle" class="visually-hidden" style="display:none;">${d.theme_toggle}</label>
          <select id="themeToggle" class="select" style="min-height:36px; padding:4px 8px; font-size:13px; width:auto;">
            <option value="system">${d.theme_system}</option>
            <option value="light">${d.theme_light}</option>
            <option value="dark">${d.theme_dark}</option>
          </select>
        </div>
      </div>
      <nav class="site-nav" role="navigation" aria-label="${isHi ? 'मुख्य नेविगेशन' : 'Main navigation'}">
        <a href="${homeHref}" ${activeNav === 'home' ? 'aria-current="page"' : ''}>${d.nav_home}</a>
        <a href="${officersHref}" ${activeNav === 'officers' ? 'aria-current="page"' : ''}>${d.nav_officers}</a>
        <a href="${rtiHref}" ${activeNav === 'rti' ? 'aria-current="page"' : ''}>${d.nav_rti}</a>
        <a href="${followUpHref}" ${activeNav === 'follow_up' ? 'aria-current="page"' : ''}>${d.nav_follow_up}</a>
        <a href="${aboutHref}" ${activeNav === 'about' ? 'aria-current="page"' : ''}>${d.nav_about}</a>
        <a href="${privacyHref}" ${activeNav === 'privacy' ? 'aria-current="page"' : ''}>${d.nav_privacy}</a>
      </nav>
    </div>
  </header>`;
}

function renderFooter(lang) {
  const d = getDict(lang);
  const isHi = lang === 'hi';
  const homeHref = isHi ? '/hi/' : '/';
  const officersHref = isHi ? '/hi/officers/' : '/officers/';
  const rtiHref = isHi ? '/hi/rti/' : '/rti/';
  const followUpHref = isHi ? '/hi/follow-up/' : '/follow-up/';
  const aboutHref = isHi ? '/hi/about/' : '/about/';
  const privacyHref = isHi ? '/hi/privacy/' : '/privacy/';

  return `
  <footer class="site-footer" role="contentinfo">
    <div class="container footer-inner">
      <p>${d.footer_disclaimer}</p>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;">
        <ul class="footer-links">
          <li><a href="${homeHref}">${d.nav_home}</a></li>
          <li><a href="${officersHref}">${d.nav_officers}</a></li>
          <li><a href="${rtiHref}">${d.nav_rti}</a></li>
          <li><a href="${followUpHref}">${d.nav_follow_up}</a></li>
          <li><a href="${aboutHref}">${d.nav_about}</a></li>
          <li><a href="${privacyHref}">${d.nav_privacy}</a></li>
          <li><a href="https://jansunwai.up.nic.in" target="_blank" rel="noopener">IGRS Jansunwai ↗</a></li>
          <li><a href="https://rtionline.up.gov.in" target="_blank" rel="noopener">UP RTI Portal ↗</a></li>
        </ul>
        <button type="button" id="btnClearData" class="btn btn-sm btn-danger">${d.btn_clear_data}</button>
      </div>
      <p style="margin-top: 8px; color: var(--muted);">${d.footer_last_updated}</p>
    </div>
  </footer>
  <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>
  <div id="printSection" class="print-only">
    <div id="printLetterBody" class="print-letter-body"></div>
    <div class="print-stub">
      <div class="print-stub-title">${d.receiving_stub_title}</div>
      <div class="print-stub-grid">
        <div class="print-stub-row">
          <div class="print-stub-cell" style="width: 25%; font-weight: bold;">${d.diary_no_label}</div>
          <div class="print-stub-cell line" style="width: 75%;">&nbsp;</div>
        </div>
        <div class="print-stub-row">
          <div class="print-stub-cell" style="font-weight: bold;">${d.receiving_date_label}</div>
          <div class="print-stub-cell line">&nbsp;</div>
        </div>
        <div class="print-stub-row">
          <div class="print-stub-cell" style="font-weight: bold;">${d.receiving_officer_label}</div>
          <div class="print-stub-cell line" style="height: 40pt;">&nbsp;</div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderHead({ title, description, lang, canonical, altLangUrl, extraJsonLd = '' }) {
  const altHreflang = lang === 'hi' ? 'en' : 'hi';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="${lang}" href="${canonical}">
  <link rel="alternate" hreflang="${altHreflang}" href="${altLangUrl}">
  <link rel="alternate" hreflang="x-default" href="https://civic-grievance-up.netlify.app/">

  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">

  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#005ea2">

  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/base.css">
  <link rel="stylesheet" href="/src/styles/components.css">
  <link rel="stylesheet" href="/src/styles/print.css" media="print">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "UP Civic Grievance Helper",
        "url": "https://civic-grievance-up.netlify.app/",
        "description": "Independent citizen tool for Uttar Pradesh civic complaints and officer directory",
        "inLanguage": ["en", "hi"]
      }
      ${extraJsonLd ? ',' + extraJsonLd : ''}
    ]
  }
  </script>
</head>
<body>
  <a href="#main" class="skip-link">${lang === 'hi' ? 'सीधे मुख्य सामग्री पर जाएं' : 'Skip to main content'}</a>`;
}

// ==========================================
// 1. HOME PAGE
// ==========================================
function generateHomePage(lang) {
  const d = getDict(lang);
  const isHi = lang === 'hi';
  const canonical = isHi ? 'https://civic-grievance-up.netlify.app/hi/' : 'https://civic-grievance-up.netlify.app/';
  const altUrl = isHi ? 'https://civic-grievance-up.netlify.app/' : 'https://civic-grievance-up.netlify.app/hi/';

  const faqSchema = `
  {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "${d.faq_q1}",
        "acceptedAnswer": { "@type": "Answer", "text": "${d.faq_a1}" }
      },
      {
        "@type": "Question",
        "name": "${d.faq_q2}",
        "acceptedAnswer": { "@type": "Answer", "text": "${d.faq_a2}" }
      },
      {
        "@type": "Question",
        "name": "${d.faq_q3}",
        "acceptedAnswer": { "@type": "Answer", "text": "${d.faq_a3}" }
      },
      {
        "@type": "Question",
        "name": "${d.faq_q4}",
        "acceptedAnswer": { "@type": "Answer", "text": "${d.faq_a4.replace('{district}', 'your-district')}" }
      }
    ]
  }`;

  return `${renderHead({
    title: isHi ? 'उ०प्र० नागरिक शिकायत सहायक | स्वतंत्र शिकायत समाधान साधन' : 'UP Civic Grievance Helper | Independent Citizen Tool for Uttar Pradesh',
    description: d.hero_desc,
    lang,
    canonical,
    altLangUrl: altUrl,
    extraJsonLd: faqSchema
  })}
  ${renderHeader(lang, 'home', isHi ? '/' : '/hi/')}

  <main id="main" class="main-content container" style="max-width: var(--tool-card-max);">
    <section class="hero-section" style="margin-bottom: var(--space-4);">
      <h1>${d.hero_title}</h1>
      <p style="font-size: var(--text-lg); color: var(--muted);">${d.hero_desc}</p>
    </section>

    <!-- 3-Step Wizard Container -->
    <div class="wizard-card" style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: var(--space-3); box-shadow: var(--shadow-sm);">
      <!-- Stepper -->
      <nav class="stepper" aria-label="${isHi ? 'प्रक्रिया चरण' : 'Process Steps'}">
        <div id="stepperItem1" class="step-item is-current">
          <span class="step-num">1</span>
          <span>${isHi ? 'समस्या' : 'Problem'}</span>
        </div>
        <div id="stepperItem2" class="step-item">
          <span class="step-num">2</span>
          <span>${isHi ? 'स्थान' : 'Location'}</span>
        </div>
        <div id="stepperItem3" class="step-item">
          <span class="step-num">3</span>
          <span>${isHi ? 'शिकायत पत्र' : 'Letter'}</span>
        </div>
      </nav>

      <!-- Step 1 Pane -->
      <div id="stepPane1" class="step-pane">
        <h2 id="stepHeading1">${d.step1_title}</h2>
        <p class="form-hint">${d.step1_desc}</p>

        <div class="tiles-grid" style="margin: var(--space-3) 0;">
          <label class="tile">
            <input type="radio" name="problemCategory" value="road" checked>
            <span class="tile-title">🛣️ ${d.cat_road}</span>
            <span class="tile-desc">${d.cat_road_default}</span>
          </label>
          <label class="tile">
            <input type="radio" name="problemCategory" value="drainage">
            <span class="tile-title">🌊 ${d.cat_drainage}</span>
            <span class="tile-desc">${d.cat_drainage_default}</span>
          </label>
          <label class="tile">
            <input type="radio" name="problemCategory" value="water">
            <span class="tile-title">🚰 ${d.cat_water}</span>
            <span class="tile-desc">${d.cat_water_default}</span>
          </label>
          <label class="tile">
            <input type="radio" name="problemCategory" value="light">
            <span class="tile-title">💡 ${d.cat_light}</span>
            <span class="tile-desc">${d.cat_light_default}</span>
          </label>
          <label class="tile">
            <input type="radio" name="problemCategory" value="garbage">
            <span class="tile-title">🧹 ${d.cat_garbage}</span>
            <span class="tile-desc">${d.cat_garbage_default}</span>
          </label>
          <label class="tile">
            <input type="radio" name="problemCategory" value="audit">
            <span class="tile-title">📋 ${d.cat_audit}</span>
            <span class="tile-desc">${d.cat_audit_default}</span>
          </label>
        </div>

        <button type="button" id="btnStep1Next" class="btn btn-primary" style="width: 100%;">
          ${d.btn_continue} &rarr;
        </button>
      </div>

      <!-- Step 2 Pane -->
      <div id="stepPane2" class="step-pane" style="display: none;">
        <h2 id="stepHeading2">${d.step2_title}</h2>
        <p class="form-hint">${d.step2_desc}</p>

        <!-- Area Type -->
        <fieldset class="form-group" style="border: none; margin: var(--space-3) 0;">
          <legend class="form-label">${d.area_type}</legend>
          <div class="tiles-grid" style="margin-top: 8px;">
            <label class="tile">
              <input type="radio" name="areaType" value="village" checked>
              <span class="tile-title">🌾 ${d.area_village}</span>
              <span class="tile-desc">${d.area_village_hint}</span>
            </label>
            <label class="tile">
              <input type="radio" name="areaType" value="town">
              <span class="tile-title">🏘️ ${d.area_town}</span>
              <span class="tile-desc">${d.area_town_hint}</span>
            </label>
            <label class="tile">
              <input type="radio" name="areaType" value="city">
              <span class="tile-title">🏛️ ${d.area_city}</span>
              <span class="tile-desc">${d.area_city_hint}</span>
            </label>
          </div>
        </fieldset>

        <!-- PWD Road Checkbox -->
        <div id="pwdRoadGroup" class="form-group" style="background: var(--bg); padding: var(--space-2); border-radius: var(--radius-sm); border: 1px solid var(--line);">
          <label class="checkbox-label">
            <input type="checkbox" id="pwdRoadCheck">
            <span>🛣️ ${d.road_pwd_checkbox}</span>
          </label>
        </div>

        <!-- District & Block -->
        <div class="grid grid-2">
          <div class="form-group">
            <label for="districtSelect" class="form-label">${d.district_label} *</label>
            <select id="districtSelect" class="select" required aria-required="true">
              <option value="">${d.district_placeholder}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="blockInput" class="form-label">${d.block_label} *</label>
            <input type="text" id="blockInput" class="input" list="blockList" placeholder="${d.block_placeholder}" required aria-required="true">
            <datalist id="blockList"></datalist>
          </div>
        </div>

        <!-- Village / Locality -->
        <div class="form-group">
          <label for="villageInput" class="form-label">${d.village_label} *</label>
          <input type="text" id="villageInput" class="input" placeholder="${d.village_placeholder}" maxlength="80" required aria-required="true">
        </div>

        <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
          <button type="button" id="btnStep2Back" class="btn btn-secondary">
            &larr; ${d.btn_back}
          </button>
          <button type="button" id="btnStep2Next" class="btn btn-primary" style="flex: 1;">
            ${d.btn_continue} &rarr;
          </button>
        </div>
      </div>

      <!-- Step 3 Pane -->
      <div id="stepPane3" class="step-pane" style="display: none;">
        <h2 id="stepHeading3">${d.step3_title}</h2>
        <p class="form-hint">${d.step3_desc}</p>

        <!-- Officer Card Preview -->
        <div id="officerCardContainer"></div>

        <!-- Applicant Inputs -->
        <div class="grid grid-2" style="margin-bottom: var(--space-3);">
          <div class="form-group">
            <label for="applicantNameInput" class="form-label">${d.applicant_name} *</label>
            <input type="text" id="applicantNameInput" class="input" placeholder="${d.applicant_name_placeholder}" maxlength="80" required aria-required="true">
          </div>
          <div class="form-group">
            <label for="applicantMobileInput" class="form-label">${d.applicant_mobile} *</label>
            <input type="tel" id="applicantMobileInput" class="input" placeholder="${d.applicant_mobile_placeholder}" pattern="^[6-9][0-9]{9}$" inputmode="numeric" maxlength="10" required aria-required="true">
            <span class="form-hint">${d.applicant_mobile_hint}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="detailsInput" class="form-label">${d.details_label} *</label>
          <textarea id="detailsInput" class="textarea" placeholder="${d.details_placeholder}" maxlength="1500" required aria-required="true"></textarea>
        </div>

        <div class="form-group">
          <label for="priorNoteInput" class="form-label">${d.prior_note_label}</label>
          <input type="text" id="priorNoteInput" class="input" placeholder="${d.prior_note_placeholder}" maxlength="200">
        </div>

        <!-- Live Letter Preview -->
        <div class="letter-panel">
          <h3 style="margin-bottom: var(--space-2);">${d.letter_preview_title}</h3>
          <div id="letterPreviewText" class="letter-text" tabindex="0"></div>

          <!-- Action Deck -->
          <div class="letter-actions">
            <a id="btnSendEmail" href="#" class="btn btn-primary">✉️ ${d.btn_email}</a>
            <a id="btnShareWhatsApp" href="#" class="btn btn-secondary" target="_blank" rel="noopener">💬 ${d.btn_whatsapp}</a>
            <button type="button" id="btnCopyLetter" class="btn btn-secondary">📋 ${d.btn_copy}</button>
            <button type="button" id="btnPrintLetter" class="btn btn-secondary">🖨️ ${d.btn_print}</button>
            <a id="btnCallOffice" href="#" class="btn btn-secondary">📞 ${d.btn_call}</a>
            <a href="https://jansunwai.up.nic.in" target="_blank" rel="noopener" class="btn btn-secondary">🌐 ${d.btn_jansunwai} ↗</a>
            <button type="button" id="btnDownloadReminders" class="btn btn-secondary">📅 ${d.btn_reminders}</button>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
          <button type="button" id="btnStep3Back" class="btn btn-secondary">
            &larr; ${d.btn_back}
          </button>
        </div>
      </div>
    </div>

    <!-- 30-Day Timeline Section -->
    <section class="timeline-section" style="margin-top: var(--space-5);">
      <h2>${d.timeline_title}</h2>
      <div class="timeline">
        <div class="timeline-item">
          <span class="timeline-dot">0</span>
          <div class="timeline-heading">${d.timeline_day0_title}</div>
          <p class="timeline-body">${d.timeline_day0_desc}</p>
        </div>
        <div class="timeline-item">
          <span class="timeline-dot">7</span>
          <div class="timeline-heading">${d.timeline_day7_title}</div>
          <p class="timeline-body">${d.timeline_day7_desc}</p>
        </div>
        <div class="timeline-item">
          <span class="timeline-dot">15</span>
          <div class="timeline-heading">${d.timeline_day15_title}</div>
          <p class="timeline-body">${d.timeline_day15_desc}</p>
        </div>
        <div class="timeline-item">
          <span class="timeline-dot">30</span>
          <div class="timeline-heading">${d.timeline_day30_title}</div>
          <p class="timeline-body">${d.timeline_day30_desc}</p>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion Section -->
    <section class="faq-section" style="margin-top: var(--space-5);">
      <h2>${d.faq_title}</h2>
      <div class="accordion">
        <details class="accordion-item" open>
          <summary class="accordion-summary">${d.faq_q1}</summary>
          <div class="accordion-body">${d.faq_a1}</div>
        </details>
        <details class="accordion-item">
          <summary class="accordion-summary">${d.faq_q2}</summary>
          <div class="accordion-body">${d.faq_a2}</div>
        </details>
        <details class="accordion-item">
          <summary class="accordion-summary">${d.faq_q3}</summary>
          <div class="accordion-body">${d.faq_a3}</div>
        </details>
        <details class="accordion-item">
          <summary class="accordion-summary">${d.faq_q4}</summary>
          <div class="accordion-body">${d.faq_a4}</div>
        </details>
      </div>
    </section>
  </main>

  ${renderFooter(lang)}

  <script type="module" src="/src/main.js"></script>
</body>
</html>`;
}

// ==========================================
// 2. DISTRICT PAGES (/district/{slug}/)
// ==========================================
function generateDistrictPage(dist, lang) {
  const d = getDict(lang);
  const isHi = lang === 'hi';
  const name = isHi ? dist.name_hi : dist.name;
  const canonical = isHi
    ? `https://civic-grievance-up.netlify.app/hi/district/${dist.slug}/`
    : `https://civic-grievance-up.netlify.app/district/${dist.slug}/`;
  const altUrl = isHi
    ? `https://civic-grievance-up.netlify.app/district/${dist.slug}/`
    : `https://civic-grievance-up.netlify.app/hi/district/${dist.slug}/`;

  const blocksListHtml = dist.blocks.map(b => {
    const bName = isHi ? b.name_hi : b.name;
    return `<li>${bName}</li>`;
  }).join('');

  return `${renderHead({
    title: isHi ? `${name} जनपद नागरिक शिकायत व अधिकारी निर्देशिका` : `${name} District Civic Grievance & Officers Directory`,
    description: isHi
      ? `${name} जनपद के विकास खंडों, खंड विकास अधिकारियों (BDO) और जनहित समाधान की जानकारी।`
      : `Administrative blocks, designated officers (BDO, EO, CDO, DM), and civic complaint routing for ${name} district, UP.`,
    lang,
    canonical,
    altLangUrl: altUrl
  })}
  ${renderHeader(lang, 'officers', altUrl)}

  <main id="main" class="main-content container" style="max-width: var(--container-max);">
    <div style="margin-bottom: var(--space-4);">
      <a href="${isHi ? '/hi/officers/' : '/officers/'}">&larr; ${isHi ? 'सभी जनपद निर्देशिका' : 'All Districts Directory'}</a>
      <h1 style="margin-top: 12px;">${name} ${isHi ? 'जनपद' : 'District'}</h1>
      <p style="font-size: var(--text-lg); color: var(--muted);">
        ${isHi ? `उत्तर प्रदेश के ${name} जनपद में कुल ${dist.blocks.length} विकास खंड सम्मिलित हैं।` : `${name} district in Uttar Pradesh comprises ${dist.blocks.length} administrative development blocks.`}
      </p>
    </div>

    <!-- CTA into Wizard with District pre-selected -->
    <div style="background: var(--surface); border: 2px solid var(--primary); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4);">
      <h3>${isHi ? `${name} में शिकायत पत्र तैयार करें` : `Draft a complaint letter for ${name}`}</h3>
      <p>${isHi ? 'अपने गाँव या कस्बे के लिए स्वतः सक्षम अधिकारी का संपर्क प्राप्त करें और औपचारिक प्रार्थना पत्र लिखें।' : 'Automatically identify your block officer, verify CUG contact details, and create your ready-to-send letter.'}</p>
      <a href="${isHi ? '/hi/' : '/'}#step-2" class="btn btn-primary">${isHi ? 'शिकायत पत्र प्रारंभ करें' : 'Start Complaint Letter'} &rarr;</a>
    </div>

    <!-- Samadhan Diwas Note -->
    <div style="background: var(--info-bg); border-left: 4px solid var(--primary); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); margin-bottom: var(--space-4);">
      <h4>📅 ${isHi ? `${name} संपूर्ण समाधान दिवस सूचना` : `${name} Sampoorna Samadhan Diwas Notice`}</h4>
      <p style="margin-bottom: 0; font-size: var(--text-sm);">
        ${isHi
          ? `${name} के सभी तहसीलों में संपूर्ण समाधान दिवस शनिवार को आयोजित किया जाता है (सटीक शनिवार रोस्टर हेतु अपनी स्थानीय तहसील में पुष्टि करें)। यदि 15 दिन में ब्लॉक स्तर पर कार्रवाई न हो, तो प्रार्थना पत्र की डायरी रसीद लेकर समाधान दिवस में उपस्थित हों।`
          : `In ${name} district, Sampoorna Samadhan Diwas is held at tehsil headquarters on designated Saturdays (check your local tehsil for the current Saturday schedule). If your grievance is unresolved after 15 days, present your stamped diary receipt directly to the SDM or CDO.`}
      </p>
    </div>

    <!-- Blocks List -->
    <section>
      <h2>${isHi ? `${name} के विकास खंड (Blocks)` : `Development Blocks in ${name}`} (${dist.blocks.length})</h2>
      <ul style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-top: 12px; padding-left: 20px;">
        ${blocksListHtml}
      </ul>
    </section>
  </main>

  ${renderFooter(lang)}
</body>
</html>`;
}

// ==========================================
// 3. OFFICERS DIRECTORY PAGE (/officers/)
// ==========================================
function generateOfficersPage(lang) {
  const d = getDict(lang);
  const isHi = lang === 'hi';
  const canonical = isHi ? 'https://civic-grievance-up.netlify.app/hi/officers/' : 'https://civic-grievance-up.netlify.app/officers/';
  const altUrl = isHi ? 'https://civic-grievance-up.netlify.app/officers/' : 'https://civic-grievance-up.netlify.app/hi/officers/';

  const districtCardsHtml = blocksData.districts.map(dist => {
    const name = isHi ? dist.name_hi : dist.name;
    const pageUrl = isHi ? `/hi/district/${dist.slug}/` : `/district/${dist.slug}/`;
    return `
    <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: var(--space-2); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="font-size: var(--text-base); margin-bottom: 2px;">${name}</h3>
        <span style="font-size: var(--text-xs); color: var(--muted);">${dist.blocks.length} ${isHi ? 'ब्लॉक' : 'blocks'}</span>
      </div>
      <a href="${pageUrl}" class="btn btn-sm btn-secondary">${isHi ? 'विवरण' : 'View'} &rarr;</a>
    </div>`;
  }).join('');

  return `${renderHead({
    title: isHi ? 'उत्तर प्रदेश जनपद व अधिकारी निर्देशिका' : 'Uttar Pradesh Districts & Officers Directory',
    description: isHi ? 'उत्तर प्रदेश के सभी 75 जनपदों की प्रशासनिक सूची एवं ब्लॉक विकास अधिकारी संपर्क।' : 'Browse verified officer contacts, development blocks, and district administrative directories across Uttar Pradesh.',
    lang,
    canonical,
    altLangUrl: altUrl
  })}
  ${renderHeader(lang, 'officers', altUrl)}

  <main id="main" class="main-content container" style="max-width: var(--container-max);">
    <h1>${isHi ? 'उत्तर प्रदेश जनपद व अधिकारी निर्देशिका' : 'Uttar Pradesh Districts & Officers Directory'}</h1>
    <p style="font-size: var(--text-lg); color: var(--muted); margin-bottom: var(--space-4);">
      ${isHi ? 'प्रदेश के सभी 75 जनपदों के विकास खंडों एवं प्रशासनिक अधिकारियों की सूची।' : 'Select any of the 75 districts of Uttar Pradesh to explore development blocks and competent administrative officers.'}
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-2);">
      ${districtCardsHtml}
    </div>
  </main>

  ${renderFooter(lang)}
</body>
</html>`;
}

// ==========================================
// 4. RTI REQUEST BUILDER PAGE (/rti/)
// ==========================================
function generateRtiPage(lang) {
  const isHi = lang === 'hi';
  const canonical = isHi ? 'https://civic-grievance-up.netlify.app/hi/rti/' : 'https://civic-grievance-up.netlify.app/rti/';
  const altUrl = isHi ? 'https://civic-grievance-up.netlify.app/rti/' : 'https://civic-grievance-up.netlify.app/hi/rti/';

  return `${renderHead({
    title: isHi ? 'आरटीआई आवेदन पत्र तैयार करें | सूचना का अधिकार उत्तर प्रदेश' : 'RTI Request Builder | Right to Information Uttar Pradesh',
    description: isHi ? 'उत्तर प्रदेश में सार्वजनिक विकास कार्यों के सरकारी अभिलेख, माप पुस्तिका और व्यय विवरण हेतु आरटीआई आवेदन तैयार करें।' : 'Draft a formal Right to Information (RTI) request for public work records, measurement books, and expenditure vouchers in Uttar Pradesh.',
    lang,
    canonical,
    altLangUrl: altUrl
  })}
  ${renderHeader(lang, 'rti', altUrl)}

  <main id="main" class="main-content container" style="max-width: var(--tool-card-max);">
    <h1>${isHi ? 'सूचना का अधिकार (RTI) आवेदन पत्र' : 'Right to Information (RTI) Request Builder'}</h1>

    <!-- Important Notice: Request for records, NOT complaint -->
    <div style="background: var(--info-bg); border-left: 4px solid var(--primary); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); margin-bottom: var(--space-4);">
      <h3 style="font-size: var(--text-base); margin-bottom: 4px;">ℹ️ ${isHi ? 'महत्वपूर्ण सूचना: आरटीआई शिकायत पत्र नहीं है' : 'Important: RTI is for public records, not complaints'}</h3>
      <p style="font-size: var(--text-sm); margin-bottom: 0;">
        ${isHi
          ? 'सूचना का अधिकार अधिनियम, 2005 का उपयोग केवल सरकारी अभिलेखों (जैसे माप पुस्तिका, मस्टर रोल, स्वीकृत प्राक्कलन, वाउचर) की प्रमाणित प्रति प्राप्त करने हेतु किया जाता है। यदि आपको समस्या का निवारण कराना है, तो मुख्य पृष्ठ पर शिकायत पत्र का उपयोग करें। <br><a href="https://rtionline.up.gov.in" target="_blank" rel="noopener">उ०प्र० आरटीआई ऑनलाइन पोर्टल पर वर्तमान प्रारूप व शुल्क जांचें ↗</a>'
          : 'The Right to Information Act, 2005 is strictly for inspecting and obtaining certified copies of existing government records (such as Measurement Books, muster rolls, technical sanctions, or payment vouchers). If you need an issue fixed, use the complaint tool on the home page. <br><a href="https://rtionline.up.gov.in" target="_blank" rel="noopener">Check current format and fee on the UP RTI portal (rtionline.up.gov.in) ↗</a>'}
      </p>
    </div>

    <form id="rtiForm" style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: var(--space-3); margin-bottom: var(--space-4);">
      <div class="grid grid-2">
        <div class="form-group">
          <label for="rtiName" class="form-label">${isHi ? 'आवेदक का नाम' : 'Applicant Name'} *</label>
          <input type="text" id="rtiName" class="input" placeholder="${isHi ? 'अपना पूरा नाम लिखें' : 'Your full name'}" required>
        </div>
        <div class="form-group">
          <label for="rtiMobile" class="form-label">${isHi ? 'मोबाइल नंबर' : 'Mobile Number'} *</label>
          <input type="tel" id="rtiMobile" class="input" placeholder="${isHi ? '10 अंकों का मोबाइल' : '10-digit mobile'}" maxlength="10" required>
        </div>
      </div>

      <div class="form-group">
        <label for="rtiAddress" class="form-label">${isHi ? 'पत्राचार का पता' : 'Postal Address'} *</label>
        <input type="text" id="rtiAddress" class="input" placeholder="${isHi ? 'ग्राम/मोहल्ला, पोस्ट, ब्लॉक, जनपद' : 'Village/Mohalla, Post, Block, District'}" required>
      </div>

      <div class="form-group">
        <label for="rtiAuthority" class="form-label">${isHi ? 'लोक सूचना अधिकारी / कार्यालय' : 'Public Authority / Office'} *</label>
        <input type="text" id="rtiAuthority" class="input" placeholder="${isHi ? 'उदा० खंड विकास अधिकारी कार्यालय, ब्लॉक शाहगंज, जौनपुर' : 'e.g. Office of the Block Development Officer, Shahganj, Jaunpur'}" required>
      </div>

      <fieldset class="form-group" style="border: none;">
        <legend class="form-label">${isHi ? 'चाही गई सूचना / अभिलेख (चयन करें)' : 'Requested Records (Select all that apply)'}</legend>
        <label class="checkbox-label">
          <input type="checkbox" name="rtiRecord" value="${isHi ? 'स्वीकृत कार्य का तकनीकी प्राक्कलन (Technical Sanction & Estimate)' : 'Certified copy of Technical Sanction and detailed Estimate'}" checked>
          <span>${isHi ? 'स्वीकृत कार्य का तकनीकी प्राक्कलन (Technical Sanction)' : 'Technical Sanction & Estimate'}</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" name="rtiRecord" value="${isHi ? 'माप पुस्तिका (Measurement Book - MB) की प्रमाणित प्रतिलिपि' : 'Certified copy of Measurement Book (MB) entries'}" checked>
          <span>${isHi ? 'माप पुस्तिका (Measurement Book - MB) की प्रमाणित प्रतिलिपि' : 'Measurement Book (MB) certified copy'}</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" name="rtiRecord" value="${isHi ? 'मस्टर रोल एवं श्रमिकों के भुगतान विवरण (Muster Roll & Wages)' : 'Muster rolls and laborer payment sheets'}" checked>
          <span>${isHi ? 'मस्टर रोल एवं श्रमिकों के भुगतान विवरण' : 'Muster rolls & wage payments'}</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" name="rtiRecord" value="${isHi ? 'सामग्री क्रय बिल एवं भुगतान वाउचर की प्रतियां' : 'Material purchase bills and payment vouchers'}">
          <span>${isHi ? 'सामग्री क्रय बिल एवं भुगतान वाउचर' : 'Material purchase bills & vouchers'}</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" name="rtiRecord" value="${isHi ? 'कृत कार्यवाही रिपोर्ट (Action Taken Report - ATR)' : 'Action Taken Report (ATR) on previous complaints'}">
          <span>${isHi ? 'कृत कार्यवाही रिपोर्ट (Action Taken Report - ATR)' : 'Action Taken Report (ATR)'}</span>
        </label>
      </fieldset>

      <div class="form-group">
        <label for="rtiCustomRecord" class="form-label">${isHi ? 'अन्य कोई विशिष्ट सूचना (वैकल्पिक)' : 'Additional Specific Records (Optional)'}</label>
        <input type="text" id="rtiCustomRecord" class="input" placeholder="${isHi ? 'अन्य विशिष्ट बिंदु यहाँ लिखें...' : 'Type any other specific record requested...'}">
      </div>

      <div class="form-group">
        <label for="rtiPeriod" class="form-label">${isHi ? 'समयावधि' : 'Period / Financial Year'}</label>
        <input type="text" id="rtiPeriod" class="input" placeholder="${isHi ? 'उदा० वित्तीय वर्ष 2025-2026' : 'e.g. Financial Year 2025-2026'}">
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="rtiBpl">
          <span>${isHi ? 'मैं गरीबी रेखा से नीचे (BPL) श्रेणी में आता हूँ (आवेदन शुल्क से छूट हेतु)' : 'Applicant is Below Poverty Line (BPL) - statutory fee waiver'}</span>
        </label>
      </div>
    </form>

    <!-- RTI Letter Preview -->
    <div class="letter-panel">
      <h3>${isHi ? 'आरटीआई आवेदन पूर्वावलोकन' : 'RTI Request Letter Preview'}</h3>
      <div id="rtiPreviewText" class="letter-text" tabindex="0"></div>

      <div class="letter-actions">
        <button type="button" id="btnRtiCopy" class="btn btn-secondary">📋 ${isHi ? 'आवेदन कॉपी करें' : 'Copy RTI Request'}</button>
        <button type="button" id="btnRtiPrint" class="btn btn-secondary">🖨️ ${isHi ? 'प्रिंट / PDF सुरक्षित करें' : 'Print / Save as PDF'}</button>
        <a id="btnRtiWhatsApp" href="#" target="_blank" rel="noopener" class="btn btn-secondary">💬 ${isHi ? 'व्हाट्सएप पर साझा करें' : 'Share on WhatsApp'}</a>
        <a href="https://rtionline.up.gov.in" target="_blank" rel="noopener" class="btn btn-primary">🌐 ${isHi ? 'यूपी आरटीआई ऑनलाइन पोर्टल ↗' : 'UP RTI Online Portal ↗'}</a>
      </div>
    </div>
  </main>

  ${renderFooter(lang)}

  <script type="module" src="/src/rti.js"></script>
</body>
</html>`;
}

// ==========================================
// 5. FOLLOW-UP PLAN PAGE (/follow-up/)
// ==========================================
function generateFollowUpPage(lang) {
  const d = getDict(lang);
  const isHi = lang === 'hi';
  const canonical = isHi ? 'https://civic-grievance-up.netlify.app/hi/follow-up/' : 'https://civic-grievance-up.netlify.app/follow-up/';
  const altUrl = isHi ? 'https://civic-grievance-up.netlify.app/follow-up/' : 'https://civic-grievance-up.netlify.app/hi/follow-up/';

  return `${renderHead({
    title: isHi ? '30-दिवसीय अनुवर्ती कार्ययोजना | समाधान दिवस व जनहित गारंटी' : '30-Day Follow-Up Plan | Samadhan Diwas & Legal Roadmap',
    description: isHi ? 'शिकायत दर्ज कराने के बाद 30 दिन में समाधान पाने की संपूर्ण समयबद्ध कार्ययोजना एवं कैलेंडर अनुस्मारक।' : 'A structured 30-day follow-up plan for civic grievances in Uttar Pradesh: Day 0 receipt, Day 7 CUG inquiry, Day 15 Samadhan Diwas, Day 30 reminder & RTI.',
    lang,
    canonical,
    altLangUrl: altUrl
  })}
  ${renderHeader(lang, 'follow_up', altUrl)}

  <main id="main" class="main-content container" style="max-width: var(--tool-card-max);">
    <h1>${d.timeline_title}</h1>
    <p style="font-size: var(--text-lg); color: var(--muted); margin-bottom: var(--space-4);">
      ${isHi
        ? 'सरकारी कार्यालय में शिकायत दर्ज कराना पहला कदम है। समयबद्ध समाधान सुनिश्चित करने के लिए इस 30-दिवसीय कार्ययोजना का पालन करें।'
        : 'Submitting your letter is only the first step. Follow this structured 30-day timeline to enforce accountability and statutory deadlines under the UP Janhit Guarantee Act, 2011.'}
    </p>

    <div class="timeline" style="margin-bottom: var(--space-5);">
      <div class="timeline-item">
        <span class="timeline-dot">0</span>
        <div class="timeline-heading">${d.timeline_day0_title}</div>
        <p class="timeline-body">${d.timeline_day0_desc}</p>
      </div>
      <div class="timeline-item">
        <span class="timeline-dot">7</span>
        <div class="timeline-heading">${d.timeline_day7_title}</div>
        <p class="timeline-body">${d.timeline_day7_desc}</p>
      </div>
      <div class="timeline-item">
        <span class="timeline-dot">15</span>
        <div class="timeline-heading">${d.timeline_day15_title}</div>
        <p class="timeline-body">${d.timeline_day15_desc}</p>
      </div>
      <div class="timeline-item">
        <span class="timeline-dot">30</span>
        <div class="timeline-heading">${d.timeline_day30_title}</div>
        <p class="timeline-body">${d.timeline_day30_desc}</p>
      </div>
    </div>

    <!-- Quick Links -->
    <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: var(--space-3);">
      <h3>${isHi ? 'महत्वपूर्ण आधिकारिक पोर्टल' : 'Official Government Portals'}</h3>
      <ul style="padding-left: 20px; line-height: 1.8; margin-top: 8px;">
        <li><a href="https://jansunwai.up.nic.in" target="_blank" rel="noopener">UP IGRS Jansunwai (जनसुनवाई पोर्टल) ↗</a></li>
        <li><a href="https://rtionline.up.gov.in" target="_blank" rel="noopener">UP RTI Online Portal (आरटीआई ऑनलाइन पोर्टल) ↗</a></li>
        <li><a href="tel:1076">CM Helpline 1076 (मुख्यमंत्री हेल्पलाइन)</a></li>
      </ul>
    </div>
  </main>

  ${renderFooter(lang)}
</body>
</html>`;
}

// ==========================================
// 6. ABOUT PAGE (/about/)
// ==========================================
function generateAboutPage(lang) {
  const isHi = lang === 'hi';
  const canonical = isHi ? 'https://civic-grievance-up.netlify.app/hi/about/' : 'https://civic-grievance-up.netlify.app/about/';
  const altUrl = isHi ? 'https://civic-grievance-up.netlify.app/about/' : 'https://civic-grievance-up.netlify.app/hi/about/';

  return `${renderHead({
    title: isHi ? 'हमारे बारे में | उ०प्र० नागरिक शिकायत सहायक' : 'About Us | UP Civic Grievance Helper',
    description: isHi ? 'यह स्वतंत्र नागरिक पहल क्यों बनाई गई, डेटा कैसे संकलित होता है और गलत नंबर की सूचना कैसे दें।' : 'Learn about our independent citizen initiative, our data collection methodology, and how to report outdated contacts.',
    lang,
    canonical,
    altLangUrl: altUrl
  })}
  ${renderHeader(lang, 'about', altUrl)}

  <main id="main" class="main-content container" style="max-width: var(--tool-card-max);">
    <h1>${isHi ? 'हमारे बारे में' : 'About This Initiative'}</h1>

    <div style="font-size: var(--text-base); line-height: 1.7; display: flex; flex-direction: column; gap: var(--space-3);">
      <section>
        <h2>${isHi ? 'उद्देश्य एवं मिशन' : 'Purpose & Mission'}</h2>
        <p>
          ${isHi
            ? 'उत्तर प्रदेश के ग्रामीण एवं छोटे कस्बों के नागरिकों को अपनी बुनियादी समस्याओं (टूटी सड़क, चोक नाली, खराब हैंडपंप, बंद स्ट्रीट लाइट) के समाधान हेतु सही प्रशासनिक अधिकारी का संपर्क खोजने और औपचारिक प्रार्थना पत्र तैयार करने में कठिनाई होती है। यह मंच एक स्वतंत्र जन-सहायता साधन है जिसका उद्देश्य नागरिकों को उनके वैधानिक अधिकारों के प्रति जागरूक बनाना और जवाबदेही तय करना है।'
            : 'Citizens in rural areas and small towns across Uttar Pradesh often face difficulty identifying the exact administrative officer responsible for basic local issues (broken roads, choked drainage, dry handpumps, or non-functional streetlights). UP Civic Grievance Helper is an independent citizen tool designed to empower residents with direct administrative contacts, ready-to-send complaint letters, and clear escalation protocols.'}
        </p>
      </section>

      <section>
        <h2>${isHi ? 'डेटा संकलन एवं सत्यापन पद्धति' : 'Data Methodology & Verification'}</h2>
        <p>
          ${isHi
            ? 'इस मंच पर प्रदर्शित समस्त फोन नंबर एवं ईमेल जनपद एनआईसी पोर्टलों (whos-who), विकास भवन एवं सरकारी निर्देशिकाओं से संकलित किए जाते हैं। हम प्रत्येक नंबर के साथ उसकी सत्यापन तिथि और स्रोत प्रदर्शित करते हैं। यदि कोई नंबर 6 माह से अधिक पुराना हो, तो उसे "उपयोग से पूर्व जांचें" के रूप में चिह्नित किया जाता है।'
            : 'All officer phone numbers and email addresses on this website are aggregated directly from published district administration portals ({district}.nic.in), Vikas Bhawan directories, and official government publications. Every entry clearly displays its verified date, source, and confidence status. Contacts not re-verified within 6 months are visibly marked as "Check before use".'}
        </p>
      </section>

      <section>
        <h2>${isHi ? 'गलत नंबर की सूचना कैसे दें?' : 'How to Report Outdated or Wrong Information'}</h2>
        <p>
          ${isHi
            ? 'यदि आपको कोई नंबर गलत, स्थानांतरित अधिकारी का या बंद मिले, तो आप अधिकारी कार्ड पर दिए गए "गलत नंबर की सूचना दें" लिंक पर क्लिक करके सीधे हमें ईमेल कर सकते हैं। हमारी टीम 48 घंटों में जनपद एनआईसी पोर्टल से मिलान कर उसे अद्यतन करती है।'
            : 'If you encounter an outdated, transferred officer, or unreachable phone number, click the "Report a wrong number" link directly on the officer card to notify our maintenance team. We review and update entries within 48 hours.'}
        </p>
      </section>
    </div>
  </main>

  ${renderFooter(lang)}
</body>
</html>`;
}

// ==========================================
// 7. PRIVACY PAGE (/privacy/)
// ==========================================
function generatePrivacyPage(lang) {
  const isHi = lang === 'hi';
  const canonical = isHi ? 'https://civic-grievance-up.netlify.app/hi/privacy/' : 'https://civic-grievance-up.netlify.app/privacy/';
  const altUrl = isHi ? 'https://civic-grievance-up.netlify.app/privacy/' : 'https://civic-grievance-up.netlify.app/hi/privacy/';

  return `${renderHead({
    title: isHi ? 'गोपनीयता नीति | उ०प्र० नागरिक शिकायत सहायक' : 'Privacy Notice | UP Civic Grievance Helper',
    description: isHi ? 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023) के अनुरूप स्पष्ट व सरल गोपनीयता सूचना।' : 'Plain-language privacy notice compliant with India’s Digital Personal Data Protection (DPDP) Act, 2023. No tracking, zero server logging.',
    lang,
    canonical,
    altLangUrl: altUrl
  })}
  ${renderHeader(lang, 'privacy', altUrl)}

  <main id="main" class="main-content container" style="max-width: var(--tool-card-max);">
    <h1>${isHi ? 'गोपनीयता नीति (Privacy Notice)' : 'Privacy Notice'}</h1>
    <p class="form-hint" style="margin-bottom: var(--space-4);">
      ${isHi ? 'डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के अनुरूप पारदर्शी नीति।' : 'Transparent, plain-language privacy notice compliant with India’s Digital Personal Data Protection Act, 2023.'}
    </p>

    <div style="font-size: var(--text-base); line-height: 1.7; display: flex; flex-direction: column; gap: var(--space-3);">
      <section>
        <h2>${isHi ? '1. कोई भी डेटा हमारे सर्वर पर नहीं जाता' : '1. Zero Server-Side Logging'}</h2>
        <p>
          ${isHi
            ? 'जब आप अपना नाम, मोबाइल नंबर, गाँव का नाम या शिकायत का विवरण दर्ज करते हैं, तो वह जानकारी आपके फोन या कंप्यूटर के ब्राउज़र (localStorage) में ही सुरक्षित रहती है। यह जानकारी किसी भी बाहरी सर्वर, डेटाबेस या विश्लेषण उपकरण को कभी नहीं भेजी जाती।'
            : 'When you enter your name, mobile number, locality, or grievance details, everything is processed entirely within your browser on your own device. Nothing is ever sent to our servers, external databases, or third-party APIs.'}
        </p>
      </section>

      <section>
        <h2>${isHi ? '2. कुकीज एवं ट्रैकर्स का अभाव' : '2. No Cookies, No Trackers'}</h2>
        <p>
          ${isHi
            ? 'यह वेबसाइट किसी भी प्रकार की कुकी (Cookie), विज्ञापन ट्रैकर या तीसरे पक्ष के विश्लेषण स्क्रिप्ट का उपयोग नहीं करती है।'
            : 'We do not set any tracking cookies, third-party analytics pixels, or advertising beacons. No cookie banners are needed because no cookies exist.'}
        </p>
      </section>

      <section>
        <h2>${isHi ? '3. स्थानीय ड्राफ्ट हटाना (Clear My Data)' : '3. Clearing Stored Local Data'}</h2>
        <p>
          ${isHi
            ? 'आपके द्वारा लिखा गया ड्राफ्ट पत्र केवल आपकी सुविधा के लिए आपके डिवाइस के localStorage में रहता है। आप प्रत्येक पृष्ठ के फुटर में दिए गए "मेरा डेटा हटाएं" (Clear my data) बटन पर क्लिक करके किसी भी समय इसे पूर्णतः मिटा सकते हैं।'
            : 'Any unsent draft is saved strictly in your device’s localStorage so you don’t lose your progress if you refresh or navigate back. You can delete all saved data at any time by clicking the "Clear my data" button in the footer.'}
        </p>
      </section>
    </div>
  </main>

  ${renderFooter(lang)}
</body>
</html>`;
}

// ==========================================
// 8. 404 PAGE (/404.html)
// ==========================================
function generate404Page() {
  return `${renderHead({
    title: '404 - Page Not Found | UP Civic Grievance Helper',
    description: 'The requested page was not found.',
    lang: 'en',
    canonical: 'https://civic-grievance-up.netlify.app/404.html',
    altLangUrl: 'https://civic-grievance-up.netlify.app/404.html'
  })}
  ${renderNoticeBanner('en')}
  <main id="main" class="main-content container" style="max-width: var(--tool-card-max); text-align: center; padding-top: 60px;">
    <h1>404: Page Not Found</h1>
    <p style="font-size: var(--text-lg); color: var(--muted); margin: 20px 0;">
      The page you requested could not be found or has been moved.
    </p>
    <div style="display: flex; justify-content: center; gap: 12px; margin-top: 24px;">
      <a href="/" class="btn btn-primary">Go to Home Page &rarr;</a>
      <a href="/officers/" class="btn btn-secondary">Browse Officers Directory</a>
    </div>
  </main>
  ${renderFooter('en')}
</body>
</html>`;
}

// ==========================================
// BUILD EXECUTOR
// ==========================================
function buildAll() {
  const publicDir = path.join(baseDir, 'public');

  // Helper to ensure directory exists
  function writePage(relPath, content) {
    const fullPath = path.join(baseDir, relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Generated: ${relPath}`);
  }

  // 1. Home Pages
  writePage('index.html', generateHomePage('en'));
  writePage('hi/index.html', generateHomePage('hi'));

  // 2. Officers Pages
  writePage('officers/index.html', generateOfficersPage('en'));
  writePage('hi/officers/index.html', generateOfficersPage('hi'));

  // 3. RTI Pages
  writePage('rti/index.html', generateRtiPage('en'));
  writePage('hi/rti/index.html', generateRtiPage('hi'));

  // 4. Follow-up Pages
  writePage('follow-up/index.html', generateFollowUpPage('en'));
  writePage('hi/follow-up/index.html', generateFollowUpPage('hi'));

  // 5. About Pages
  writePage('about/index.html', generateAboutPage('en'));
  writePage('hi/about/index.html', generateAboutPage('hi'));

  // 6. Privacy Pages
  writePage('privacy/index.html', generatePrivacyPage('en'));
  writePage('hi/privacy/index.html', generatePrivacyPage('hi'));

  // 7. 404 Page
  writePage('404.html', generate404Page());

  // 8. District Pages (All 75 districts in both EN & HI)
  blocksData.districts.forEach(dist => {
    writePage(`district/${dist.slug}/index.html`, generateDistrictPage(dist, 'en'));
    writePage(`hi/district/${dist.slug}/index.html`, generateDistrictPage(dist, 'hi'));
  });

  // 9. Generate Sitemap.xml
  const sitemapUrls = [
    '',
    'hi/',
    'officers/',
    'hi/officers/',
    'rti/',
    'hi/rti/',
    'follow-up/',
    'hi/follow-up/',
    'about/',
    'hi/about/',
    'privacy/',
    'hi/privacy/'
  ];

  blocksData.districts.forEach(d => {
    sitemapUrls.push(`district/${d.slug}/`);
    sitemapUrls.push(`hi/district/${d.slug}/`);
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapUrls.map(u => `  <url>
    <loc>https://civic-grievance-up.netlify.app/${u}</loc>
    <lastmod>2026-11-23</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;

  writePage('sitemap.xml', sitemapXml);

  // 10. Generate Robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://civic-grievance-up.netlify.app/sitemap.xml
`;
  writePage('robots.txt', robotsTxt);

  console.log(`\nBuild Complete: Generated ${sitemapUrls.length} pages + sitemap.xml + robots.txt`);
}

buildAll();
