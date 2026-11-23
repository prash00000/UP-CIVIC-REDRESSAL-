/**
 * UP Civic Grievance Helper - RTI Request Builder
 */

import { escapeHtml } from './lib/validate.js';
import { formatDate } from './lib/letter.js';
import { getCurrentLang } from './lib/i18n.js';

export function buildRtiLetter({
  lang = 'en',
  name = '',
  address = '',
  mobile = '',
  authority = '',
  records = [],
  customRecord = '',
  period = '',
  isBpl = false,
  date = ''
}) {
  const formattedDate = date || formatDate(new Date(), lang);
  const applicantName = name.trim() || (lang === 'hi' ? '[आपका नाम]' : '[Your Name]');
  const applicantAddress = address.trim() || (lang === 'hi' ? '[आपका पता]' : '[Your Address]');
  const applicantMobile = mobile.trim() || (lang === 'hi' ? '[मोबाइल नंबर]' : '[Mobile Number]');
  const pioAuthority = authority.trim() || (lang === 'hi' ? 'जन सूचना अधिकारी / खंड विकास अधिकारी' : 'Public Information Officer / BDO');

  let itemsList = records.map((r, i) => `${i + 1}. ${r}`).join('\n');
  if (customRecord && customRecord.trim()) {
    itemsList += `\n${records.length + 1}. ${customRecord.trim()}`;
  }
  if (!itemsList) {
    itemsList = lang === 'hi'
      ? '1. स्वीकृत विकास कार्यों का तकनीकी प्राक्कलन (Technical Estimate)\n2. माप पुस्तिका (Measurement Book - MB)\n3. व्यय विवरण एवं वाउचर प्रतिलिपि'
      : '1. Certified copy of Technical Sanction / Estimate\n2. Certified copies of Measurement Book (MB) entries\n3. Certified copy of Action Taken Report (ATR) and expenditure vouchers';
  }

  const periodText = period.trim() ? period.trim() : (lang === 'hi' ? 'विगत 1 वित्तीय वर्ष' : 'Past 1 financial year');

  if (lang === 'hi') {
    const feeClause = isBpl
      ? 'मैं गरीबी रेखा से नीचे (BPL) श्रेणी का नागरिक हूँ, अतः नियमानुसार आवेदन शुल्क से छूट प्रदान की जाए (BPL कार्ड प्रति संलग्न है)।'
      : 'आवेदन शुल्क रु० 10/- का पोस्टल आर्डर / कोर्ट फीस टिकट / चालान नियमानुसार संलग्न है।';

    return `सेवा में,
लोक सूचना अधिकारी / श्रीमान ${pioAuthority},
उत्तर प्रदेश।

विषय: सूचना का अधिकार अधिनियम, 2005 के अंतर्गत सूचना प्राप्ति हेतु आवेदन।

महोदय/महोदया,

1. आवेदक का नाम: ${applicantName}
2. पत्राचार का पता: ${applicantAddress}
3. मोबाइल नंबर: ${applicantMobile}

4. चाही गई सूचना का विवरण:
कृपया निम्नलिखित अभिलेखों एवं सूचनाओं की प्रमाणित प्रतियां उपलब्ध कराने का कष्ट करें:
${itemsList}

5. सूचना से संबंधित समयावधि:
${periodText}

6. शुल्क का विवरण:
${feeClause}

कृपया चाही गई सूचना सूचना का अधिकार अधिनियम, 2005 की धारा 7(1) के तहत 30 दिवस की निर्धारित समय-सीमा में उपलब्ध कराने का कष्ट करें।

दिनांक: ${formattedDate}
स्थान: ${applicantAddress}
भवदीय/भवदीया,

(हस्ताक्षर)
नाम: ${applicantName}
मोबाइल: ${applicantMobile}`;
  }

  // English
  const feeClause = isBpl
    ? 'I belong to the Below Poverty Line (BPL) category, hence statutory fee exemption applies under Section 7(5) of the RTI Act (BPL proof attached).'
    : 'The statutory application fee of Rs. 10/- is attached via Court Fee Stamp / IPO / Challan / Online Payment Receipt.';

  return `To,
The Public Information Officer (PIO),
Office of: ${pioAuthority},
Uttar Pradesh.

Subject: Application for obtaining information under the Right to Information Act, 2005.

Respected Sir or Madam,

1. Name of Applicant: ${applicantName}
2. Postal Address: ${applicantAddress}
3. Mobile Number: ${applicantMobile}

4. Particulars of Information Required:
Please provide certified copies and inspection of the following public records:
${itemsList}

5. Period to which information pertains:
${periodText}

6. Application Fee Details:
${feeClause}

Kindly provide the certified records within the statutory period of 30 days as prescribed under Section 7(1) of the RTI Act, 2005.

Date: ${formattedDate}
Place: ${applicantAddress}

Yours faithfully,

(Signature)
Name: ${applicantName}
Mobile: ${applicantMobile}`;
}

export function initRti() {
  const lang = getCurrentLang();
  const form = document.getElementById('rtiForm');
  const preview = document.getElementById('rtiPreviewText');
  const printBox = document.getElementById('printLetterBody');
  if (!form || !preview) return;

  function updatePreview() {
    const name = document.getElementById('rtiName')?.value || '';
    const address = document.getElementById('rtiAddress')?.value || '';
    const mobile = document.getElementById('rtiMobile')?.value || '';
    const authority = document.getElementById('rtiAuthority')?.value || '';
    const period = document.getElementById('rtiPeriod')?.value || '';
    const customRecord = document.getElementById('rtiCustomRecord')?.value || '';
    const isBpl = document.getElementById('rtiBpl')?.checked || false;

    const checkedBoxes = Array.from(document.querySelectorAll('input[name="rtiRecord"]:checked')).map(cb => cb.value);

    const letter = buildRtiLetter({
      lang,
      name,
      address,
      mobile,
      authority,
      records: checkedBoxes,
      customRecord,
      period,
      isBpl
    });

    preview.textContent = letter;
    if (printBox) printBox.textContent = letter;

    const waBtn = document.getElementById('btnRtiWhatsApp');
    if (waBtn) {
      waBtn.href = `https://wa.me/?text=${encodeURIComponent(letter)}`;
    }
  }

  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);

  document.getElementById('btnRtiCopy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(preview.textContent);
      alert(lang === 'hi' ? '✓ आरटीआई आवेदन कॉपी हो गया' : '✓ RTI request copied to clipboard');
    } catch (e) {
      alert('Could not copy to clipboard');
    }
  });

  document.getElementById('btnRtiPrint')?.addEventListener('click', () => {
    window.print();
  });

  updatePreview();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('rtiForm')) {
      initRti();
    }
  });
}
