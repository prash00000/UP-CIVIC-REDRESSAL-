/**
 * UP Civic Grievance Helper - Main Client Script
 */

import { buildLetter } from './lib/letter.js';
import { validateStep1, validateStep2, validateStep3, escapeHtml } from './lib/validate.js';
import { resolveOfficer, getDistrictLookup } from './lib/officers.js';
import { downloadIcs } from './lib/ics.js';
import { saveDraft, loadDraft, clearDraft, saveTheme, loadTheme } from './lib/storage.js';
import { getCurrentLang } from './lib/i18n.js';
import { lookupPincode } from './lib/pincode.js';

// State container
export const state = {
  lang: 'en',
  currentStep: 1,
  category: 'road',
  pincode: '',
  areaType: 'village',
  districtSlug: '',
  districtName: '',
  districtNameHi: '',
  blockSlug: '',
  blockName: '',
  blockNameHi: '',
  village: '',
  isPwdRoad: false,
  applicantName: '',
  applicantMobile: '',
  details: '',
  priorNote: '',
  officer: {},
  blocksData: null,
  districtLookup: null,
  i18n: {}
};

/**
 * Shows accessible toast notification
 */
export function showToast(message) {
  const container = document.getElementById('toastRegion');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Initializes Theme
 */
function initTheme() {
  const saved = loadTheme();
  applyTheme(saved);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.value = saved;
    themeToggle.addEventListener('change', (e) => {
      const val = e.target.value;
      saveTheme(val);
      applyTheme(val);
      showToast(`Theme set to ${val}`);
    });
  }
}

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/**
 * Loads i18n dictionary for current language
 */
async function loadI18n(lang) {
  try {
    const res = await fetch(`/i18n/${lang}.json`);
    if (res.ok) {
      state.i18n = await res.json();
    }
  } catch (e) {
    console.warn('Could not load i18n file, using inline fallbacks:', e);
  }
}

/**
 * Loads blocks.json
 */
async function loadBlocksData() {
  try {
    const res = await fetch('/data/blocks.json');
    if (res.ok) {
      state.blocksData = await res.json();
      populateDistrictSelect();
    }
  } catch (e) {
    console.warn('Could not load blocks.json:', e);
  }
}

function populateDistrictSelect() {
  const select = document.getElementById('districtSelect');
  if (!select || !state.blocksData?.districts) return;

  const currentVal = select.value || state.districtSlug;
  select.innerHTML = `<option value="">${state.lang === 'hi' ? '-- जनपद चुनें --' : '-- Select District --'}</option>`;

  state.blocksData.districts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.slug;
    const label = state.lang === 'hi' ? `${d.name_hi} (${d.name})` : d.name;
    opt.textContent = label;
    opt.innerText = label;
    opt.innerHTML = escapeHtml(label);
    opt.dataset.name = d.name;
    opt.dataset.nameHi = d.name_hi;
    if (d.slug === currentVal) opt.selected = true;
    select.appendChild(opt);
  });

  if (currentVal) {
    updateDistrictSelection(currentVal);
  }
}

async function updateDistrictSelection(slug) {
  state.districtSlug = slug;
  const distObj = state.blocksData?.districts?.find(d => d.slug === slug || d.name.toLowerCase() === (slug || '').toLowerCase());
  if (distObj) {
    state.districtSlug = distObj.slug;
    state.districtName = distObj.name;
    state.districtNameHi = distObj.name_hi;
  } else {
    state.districtName = slug;
  }

  // Populate block datalist
  const datalist = document.getElementById('blockList');
  if (datalist && distObj) {
    datalist.innerHTML = '';
    distObj.blocks.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.dataset.slug = b.slug;
      opt.dataset.nameHi = b.name_hi;
      datalist.appendChild(opt);
    });
  }

  // Fetch district lookup JSON
  if (slug) {
    state.districtLookup = await getDistrictLookup(state.districtSlug);
    updateOfficerPreview();
  }
}

/**
 * Resolves officer from current state
 */
export function updateOfficerPreview() {
  const blockInput = document.getElementById('blockInput');
  const enteredBlock = blockInput ? blockInput.value.trim() : state.blockName;
  state.blockName = enteredBlock;

  // Find block slug
  let bSlug = enteredBlock.toLowerCase().replace(/\s+/g, '-');
  let bNameHi = enteredBlock;
  const distObj = state.blocksData?.districts.find(d => d.slug === state.districtSlug);
  if (distObj) {
    const matched = distObj.blocks.find(b => b.name.toLowerCase() === enteredBlock.toLowerCase() || b.slug === bSlug);
    if (matched) {
      bSlug = matched.slug;
      bNameHi = matched.name_hi;
    }
  }
  state.blockSlug = bSlug;
  state.blockNameHi = bNameHi;

  state.officer = resolveOfficer({
    areaType: state.areaType,
    districtSlug: state.districtSlug,
    districtName: state.districtName,
    districtNameHi: state.districtNameHi,
    blockSlug: state.blockSlug,
    blockName: state.blockName,
    blockNameHi: state.blockNameHi,
    category: state.category,
    isPwdRoad: state.isPwdRoad,
    lookupData: state.districtLookup
  });

  renderOfficerCard(state.officer);
  updateLetterPreview();
}

/**
 * Renders Officer Card
 */
function renderOfficerCard(officer) {
  const card = document.getElementById('officerCardContainer');
  if (!card) return;

  const isHi = state.lang === 'hi';
  const designation = isHi ? officer.designation_hi : officer.designation;
  const office = isHi ? officer.office_hi : officer.office;

  let badgeClass = 'badge-single';
  let badgeText = isHi ? 'एकल स्रोत' : 'Single source';

  if (officer.status === 'verified') {
    badgeClass = 'badge-verified';
    badgeText = isHi ? '✓ सत्यापित' : '✓ Verified';
  } else if (officer.status === 'from_district_website') {
    badgeClass = 'badge-district';
    badgeText = isHi ? 'जनपद पोर्टल' : 'From district website';
  } else if (officer.status === 'check_before_use') {
    badgeClass = 'badge-warn';
    badgeText = isHi ? '⚠️ उपयोग से पूर्व जांचें' : '⚠️ Check before use';
  } else if (officer.status === 'conflicting') {
    badgeClass = 'badge-warn';
    badgeText = isHi ? '⚠️ विरोधाभासी डेटा' : '⚠️ Conflicting data';
  } else if (officer.status === 'not_verified') {
    badgeClass = 'badge-not-verified';
    badgeText = isHi ? 'अभी सत्यापित नहीं' : 'Not verified yet';
  }

  // Missing contact state
  if (officer.status === 'not_verified' || (!officer.phone && !officer.email)) {
    const distSlug = state.districtSlug || 'district';
    card.innerHTML = `
      <div class="officer-card">
        <div class="officer-card-header">
          <span class="officer-title">${escapeHtml(designation)}</span>
          <span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span>
        </div>
        <p class="officer-office">${escapeHtml(office)}</p>
        <div class="officer-missing-box">
          <h4>${isHi ? 'वर्तमान में इस कार्यालय का सत्यापित संपर्क उपलब्ध नहीं है।' : 'We don’t have a verified contact for this office yet.'}</h4>
          <ol>
            <li>${isHi ? 'प्रार्थना पत्र की मुद्रित प्रति ब्लॉक/तहसील में जमा कर डायरी नंबर रसीद अवश्य लें।' : 'Submit a physical printed copy at the office and obtain a signed diary receipt.'}</li>
            <li>${isHi ? 'इस शिकायत को सीधे <a href="https://jansunwai.up.nic.in" target="_blank" rel="noopener">जनसुनवाई पोर्टल (jansunwai.up.nic.in)</a> पर दर्ज कराएं।' : 'File this complaint on the <a href="https://jansunwai.up.nic.in" target="_blank" rel="noopener">UP Jansunwai portal (jansunwai.up.nic.in)</a>.'}</li>
            <li>${isHi ? `अपने जनपद पोर्टल <a href="https://${distSlug}.nic.in" target="_blank" rel="noopener">${distSlug}.nic.in</a> पर संपर्क देखें।` : `Check the officer directory on your district website (<a href="https://${distSlug}.nic.in" target="_blank" rel="noopener">${distSlug}.nic.in</a>).`}</li>
          </ol>
        </div>
      </div>
    `;
    return;
  }

  // Standard or Warning state
  let warningHtml = '';
  if (officer.warning) {
    warningHtml = `<div class="officer-warning">${escapeHtml(officer.warning)}</div>`;
  }

  const phoneHtml = officer.phone
    ? `<div class="contact-row"><span class="contact-label">${isHi ? 'फोन:' : 'Phone:'}</span> <a href="tel:${escapeHtml(officer.phone.split('/')[0].trim())}">${escapeHtml(officer.phone)}</a></div>`
    : `<div class="contact-row"><span class="contact-label">${isHi ? 'फोन:' : 'Phone:'}</span> <em>${isHi ? 'उपलब्ध नहीं' : 'Not available'}</em></div>`;

  const emailHtml = officer.email
    ? `<div class="contact-row"><span class="contact-label">${isHi ? 'ईमेल:' : 'Email:'}</span> <a href="mailto:${escapeHtml(officer.email)}">${escapeHtml(officer.email)}</a></div>`
    : `<div class="contact-row"><span class="contact-label">${isHi ? 'ईमेल:' : 'Email:'}</span> <em>${isHi ? 'उपलब्ध नहीं' : 'Not available'}</em></div>`;

  card.innerHTML = `
    <div class="officer-card">
      <div class="officer-card-header">
        <span class="officer-title">${escapeHtml(designation)}</span>
        <span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span>
      </div>
      <p class="officer-office">${escapeHtml(office)}</p>
      <div class="officer-contacts">
        ${phoneHtml}
        ${emailHtml}
      </div>
      ${warningHtml}
      <div class="officer-meta">
        <span>${isHi ? 'सत्यापन तिथि:' : 'Checked on:'} ${escapeHtml(officer.checked)}</span>
        <span>•</span>
        <a href="${escapeHtml(officer.source)}" target="_blank" rel="noopener">${isHi ? 'स्रोत' : 'Source'}</a>
        <span>•</span>
        <a href="${officer.reportEmail}">${isHi ? 'गलत नंबर की सूचना दें' : 'Report a wrong number'}</a>
      </div>
    </div>
  `;
}

/**
 * Updates Letter Preview & Print Section
 */
export function updateLetterPreview() {
  const previewBox = document.getElementById('letterPreviewText');
  const printBox = document.getElementById('printLetterBody');
  if (!previewBox) return;

  const letterText = buildLetter({
    lang: state.lang,
    officer: state.officer,
    applicant: { name: state.applicantName, mobile: state.applicantMobile },
    location: { village: state.village, block: state.blockName, district: state.districtName },
    category: state.category,
    details: state.details,
    prior: state.priorNote
  });

  previewBox.textContent = letterText;
  if (printBox) {
    printBox.textContent = letterText;
  }

  // Update Action Buttons
  const emailBtn = document.getElementById('btnSendEmail');
  if (emailBtn) {
    if (state.officer.email) {
      emailBtn.style.display = 'inline-flex';
      const subject = encodeURIComponent(`Complaint regarding ${state.category} in ${state.village || 'area'}`);
      emailBtn.href = `mailto:${state.officer.email}?subject=${subject}&body=${encodeURIComponent(letterText)}`;
    } else {
      emailBtn.style.display = 'none';
    }
  }

  const callBtn = document.getElementById('btnCallOffice');
  if (callBtn) {
    if (state.officer.phone) {
      const cleanPhone = state.officer.phone.split('/')[0].replace(/[^0-9+]/g, '');
      callBtn.style.display = 'inline-flex';
      callBtn.href = `tel:${cleanPhone}`;
    } else {
      callBtn.style.display = 'none';
    }
  }

  const waBtn = document.getElementById('btnShareWhatsApp');
  if (waBtn) {
    waBtn.href = `https://wa.me/?text=${encodeURIComponent(letterText)}`;
  }

  saveDraft({
    category: state.category,
    areaType: state.areaType,
    districtSlug: state.districtSlug,
    districtName: state.districtName,
    districtNameHi: state.districtNameHi,
    blockSlug: state.blockSlug,
    blockName: state.blockName,
    blockNameHi: state.blockNameHi,
    village: state.village,
    isPwdRoad: state.isPwdRoad,
    applicantName: state.applicantName,
    applicantMobile: state.applicantMobile,
    details: state.details,
    priorNote: state.priorNote,
    currentStep: state.currentStep
  });
}

/**
 * Step navigation with hash support and focus management
 */
export function goToStep(stepNum) {
  state.currentStep = stepNum;
  window.location.hash = `step-${stepNum}`;

  for (let i = 1; i <= 3; i++) {
    const pane = document.getElementById(`stepPane${i}`);
    const stepperItem = document.getElementById(`stepperItem${i}`);
    if (pane) {
      pane.style.display = i === stepNum ? 'block' : 'none';
    }
    if (stepperItem) {
      stepperItem.classList.remove('is-current', 'is-done');
      if (i === stepNum) stepperItem.classList.add('is-current');
      else if (i < stepNum) stepperItem.classList.add('is-done');
    }
  }

  // Focus step heading
  const heading = document.getElementById(`stepHeading${stepNum}`);
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Initialize Wizard Interactions
 */
function initWizard() {
  state.lang = getCurrentLang();
  loadI18n(state.lang);
  loadBlocksData();

  // Restore draft if any
  const saved = loadDraft();
  if (saved) {
    const allowedKeys = [
      'category', 'areaType', 'districtSlug', 'districtName', 'districtNameHi',
      'blockSlug', 'blockName', 'blockNameHi', 'village', 'isPwdRoad',
      'applicantName', 'applicantMobile', 'details', 'priorNote', 'currentStep'
    ];
    allowedKeys.forEach(k => {
      if (saved[k] !== undefined) state[k] = saved[k];
    });
  }

  // Bind Step 1 problem selection
  const radioTiles = document.querySelectorAll('input[name="problemCategory"]');
  radioTiles.forEach(radio => {
    if (radio.value === state.category) radio.checked = true;
    radio.addEventListener('change', (e) => {
      state.category = e.target.value;
      const defaultTextKey = `cat_${state.category}_default`;
      if (state.i18n[defaultTextKey]) {
        state.details = state.i18n[defaultTextKey];
        const detailsInput = document.getElementById('detailsInput');
        if (detailsInput) detailsInput.value = state.details;
      }
      // Show/hide PWD road checkbox
      const pwdBox = document.getElementById('pwdRoadGroup');
      if (pwdBox) {
        pwdBox.style.display = state.category === 'road' ? 'block' : 'none';
      }
    });
  });

  // Bind Step 2 location fields & PIN code detection (Addendum)
  const pinInput = document.getElementById('pincodeInput');
  const pinStatus = document.getElementById('pincodeStatus');
  const btnClearPin = document.getElementById('btnClearPincode');
  const villageList = document.getElementById('villageLocalityList');

  if (pinInput) {
    if (state.pincode) {
      pinInput.value = state.pincode;
      if (btnClearPin) btnClearPin.style.display = 'inline-block';
    }
    pinInput.addEventListener('input', async (e) => {
      const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = cleanVal;
      state.pincode = cleanVal;
      if (btnClearPin) btnClearPin.style.display = cleanVal ? 'inline-block' : 'none';

      if (cleanVal.length === 6) {
        if (pinStatus) pinStatus.textContent = state.lang === 'hi' ? 'खोज रहे हैं...' : 'Looking up PIN...';
        const res = await lookupPincode(cleanVal);
        if (res.valid) {
          const msg = state.lang === 'hi' ? res.message_hi : res.message_en;
          if (pinStatus) {
            let statusText = msg;
            if (res.hasTownOffice) {
              statusText += ' ' + (state.lang === 'hi' ? '• इस पिन कोड में कस्बा/नगर डाकघर है।' : '• Note: Town post office detected.');
            }
            pinStatus.textContent = statusText;
          }

          // Populate locality suggestions
          if (villageList && Array.isArray(res.localities)) {
            villageList.innerHTML = '';
            res.localities.forEach(loc => {
              const opt = document.createElement('option');
              opt.value = loc;
              villageList.appendChild(opt);
            });
          }

          // If single district, auto-select district
          if (!res.isMultiDistrict && res.districtSlug) {
            const dSelect = document.getElementById('districtSelect');
            if (dSelect) {
              dSelect.value = res.districtSlug;
              updateDistrictSelection(res.districtSlug);
            }
          }
        } else {
          const msg = state.lang === 'hi' ? (res.message_hi || res.error) : (res.message_en || res.error);
          if (pinStatus) pinStatus.textContent = msg;
        }
      } else {
        if (pinStatus) pinStatus.textContent = '';
      }
    });

    if (btnClearPin) {
      btnClearPin.addEventListener('click', () => {
        pinInput.value = '';
        state.pincode = '';
        btnClearPin.style.display = 'none';
        if (pinStatus) pinStatus.textContent = '';
        if (villageList) villageList.innerHTML = '';
      });
    }
  }

  const areaRadios = document.querySelectorAll('input[name="areaType"]');
  areaRadios.forEach(radio => {
    if (radio.value === state.areaType) radio.checked = true;
    radio.addEventListener('change', (e) => {
      state.areaType = e.target.value;
      updateOfficerPreview();
    });
  });

  const distSelect = document.getElementById('districtSelect');
  if (distSelect) {
    distSelect.addEventListener('change', (e) => {
      updateDistrictSelection(e.target.value);
    });
  }

  const blockInput = document.getElementById('blockInput');
  if (blockInput) {
    if (state.blockName) blockInput.value = state.blockName;
    blockInput.addEventListener('input', () => {
      updateOfficerPreview();
    });
  }

  const villageInput = document.getElementById('villageInput');
  if (villageInput) {
    if (state.village) villageInput.value = state.village;
    villageInput.addEventListener('input', (e) => {
      state.village = e.target.value;
      updateLetterPreview();
    });
  }

  const pwdCheck = document.getElementById('pwdRoadCheck');
  if (pwdCheck) {
    pwdCheck.checked = state.isPwdRoad;
    pwdCheck.addEventListener('change', (e) => {
      state.isPwdRoad = e.target.checked;
      updateOfficerPreview();
    });
  }

  // Bind Step 3 applicant details
  const nameInput = document.getElementById('applicantNameInput');
  if (nameInput) {
    if (state.applicantName) nameInput.value = state.applicantName;
    nameInput.addEventListener('input', (e) => {
      state.applicantName = e.target.value;
      updateLetterPreview();
    });
  }

  const mobileInput = document.getElementById('applicantMobileInput');
  if (mobileInput) {
    if (state.applicantMobile) mobileInput.value = state.applicantMobile;
    mobileInput.addEventListener('input', (e) => {
      state.applicantMobile = e.target.value;
      updateLetterPreview();
    });
  }

  const detailsInput = document.getElementById('detailsInput');
  if (detailsInput) {
    if (state.details) detailsInput.value = state.details;
    detailsInput.addEventListener('input', (e) => {
      state.details = e.target.value;
      updateLetterPreview();
    });
  }

  const priorInput = document.getElementById('priorNoteInput');
  if (priorInput) {
    if (state.priorNote) priorInput.value = state.priorNote;
    priorInput.addEventListener('input', (e) => {
      state.priorNote = e.target.value;
      updateLetterPreview();
    });
  }

  // Navigation Buttons
  const btnStep1Next = document.getElementById('btnStep1Next');
  if (btnStep1Next) {
    btnStep1Next.addEventListener('click', () => {
      const res = validateStep1(state, state.i18n);
      if (!res.valid) {
        showToast(res.errors.category);
        return;
      }
      goToStep(2);
    });
  }

  const btnStep2Back = document.getElementById('btnStep2Back');
  if (btnStep2Back) {
    btnStep2Back.addEventListener('click', () => goToStep(1));
  }

  const btnStep2Next = document.getElementById('btnStep2Next');
  if (btnStep2Next) {
    btnStep2Next.addEventListener('click', () => {
      const res = validateStep2(state, state.i18n);
      if (!res.valid) {
        const firstErr = Object.values(res.errors)[0];
        showToast(firstErr);
        // Focus invalid field
        if (res.errors.district) distSelect?.focus();
        else if (res.errors.block) blockInput?.focus();
        else if (res.errors.village) villageInput?.focus();
        return;
      }
      updateOfficerPreview();
      goToStep(3);
    });
  }

  const btnStep3Back = document.getElementById('btnStep3Back');
  if (btnStep3Back) {
    btnStep3Back.addEventListener('click', () => goToStep(2));
  }

  // Copy Letter Button
  const btnCopy = document.getElementById('btnCopyLetter');
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      const letterText = document.getElementById('letterPreviewText')?.textContent || '';
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(letterText);
        } else {
          const ta = document.createElement('textarea');
          ta.value = letterText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        showToast(state.lang === 'hi' ? '✓ पत्र कॉपी हो गया' : '✓ Letter copied to clipboard');
      } catch (err) {
        showToast(state.lang === 'hi' ? 'कॉपी करने में असमर्थ' : 'Failed to copy letter');
      }
    });
  }

  // Print Letter Button
  const btnPrint = document.getElementById('btnPrintLetter');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Download Reminders (.ics) Button
  const btnIcs = document.getElementById('btnDownloadReminders');
  if (btnIcs) {
    btnIcs.addEventListener('click', () => {
      downloadIcs({
        startDate: new Date(),
        problem: state.category,
        district: state.districtName,
        block: state.blockName,
        officer: state.officer.designation || 'Block Officer'
      });
      showToast(state.lang === 'hi' ? '✓ अनुस्मारक (.ics) डाउनलोड हुआ' : '✓ Calendar reminders downloaded (.ics)');
    });
  }

  // Clear data button
  const btnClear = document.getElementById('btnClearData');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      clearDraft();
      showToast(state.lang === 'hi' ? 'सारा ड्राफ्ट डेटा हटा दिया गया' : 'All stored draft data cleared');
      setTimeout(() => window.location.reload(), 1000);
    });
  }

  // Hash change handling
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash === '#step-1') goToStep(1);
    else if (hash === '#step-2') goToStep(2);
    else if (hash === '#step-3') goToStep(3);
  });

  if (window.location.hash === '#step-2') goToStep(2);
  else if (window.location.hash === '#step-3') goToStep(3);
  else goToStep(1);
}

// Auto-run on DOMContentLoaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    if (document.getElementById('stepPane1')) {
      initWizard();
    }
  });
}
