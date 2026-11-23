/**
 * Pure Letter Generation Engine for English and Hindi
 * Adheres strictly to Section 5.9 of AGENT_FULLSTACK_SPEC.md
 */

const HINDI_MONTHS = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CATEGORY_LABELS = {
  road: { en: 'Road and paving', hi: 'सड़क और खड़ंजा' },
  drainage: { en: 'Drainage and waterlogging', hi: 'नाली और जलभराव' },
  water: { en: 'Drinking water', hi: 'पेयजल' },
  lights: { en: 'Street lights', hi: 'स्ट्रीट लाइट' },
  sanitation: { en: 'Garbage and sanitation', hi: 'सफाई और कूड़ा' },
  funds: { en: 'Public works and funds', hi: 'विकास कार्य और धन' }
};

export function formatDate(date = new Date(), lang = 'en') {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDate();
  const year = d.getFullYear();
  if (lang === 'hi') {
    return `${day} ${HINDI_MONTHS[d.getMonth()]} ${year}`;
  }
  return `${day} ${ENGLISH_MONTHS[d.getMonth()]} ${year}`;
}

export function buildLetter({
  lang = 'en',
  officer = {},
  applicant = {},
  location = {},
  category = 'road',
  details = '',
  prior = '',
  date = new Date(),
  cc = []
}) {
  const isHi = lang === 'hi';
  const formattedDate = formatDate(date, lang);

  const name = applicant.name || (isHi ? '[आपका नाम]' : '[Your Name]');
  const mobile = applicant.mobile || (isHi ? '[मोबाइल नंबर]' : '[Mobile Number]');
  const village = location.village || (isHi ? '[ग्राम/मोहल्ला]' : '[Village/Locality]');
  const block = location.block || (isHi ? '[ब्लॉक/कस्बा]' : '[Block/Town]');
  const district = location.district || (isHi ? '[जनपद]' : '[District]');

  const catObj = CATEGORY_LABELS[category] || { en: category, hi: category };
  const problem = isHi ? catObj.hi : catObj.en;

  const designation = isHi
    ? (officer.designation_hi || officer.designation || 'खंड विकास अधिकारी (BDO)')
    : (officer.designation || 'Block Development Officer (BDO)');

  let resolvedDetails = details.trim();
  if (!resolvedDetails) {
    resolvedDetails = isHi
      ? 'कृपया संबंधित समस्या का विवरण, स्थल की स्थिति तथा कब से समस्या बनी हुई है, स्पष्ट लिखें।'
      : 'Please describe the problem location, duration, and details.';
  }

  const priorText = prior && prior.trim()
    ? (isHi ? `पूर्व संदर्भ: ${prior.trim()}।` : `Prior note: ${prior.trim()}.`)
    : '';

  let ccList = '';
  if (Array.isArray(cc) && cc.length > 0) {
    ccList = cc.join(', ');
  } else if (isHi && Array.isArray(officer.ccList_hi) && officer.ccList_hi.length > 0) {
    ccList = officer.ccList_hi.join(', ');
  } else if (Array.isArray(officer.ccList) && officer.ccList.length > 0) {
    ccList = (isHi && officer.ccList_hi ? officer.ccList_hi.join(', ') : officer.ccList.join(', '));
  }

  const ccBlock = ccList ? (isHi ? `\n\nप्रतिलिपि: ${ccList}` : `\n\nCopy to: ${ccList}`) : '';
  const priorBlock = priorText ? `\n\n${priorText}` : '';

  if (isHi) {
    return `सेवा में,
श्रीमान ${designation},
${block}, जनपद ${district}

विषय: ${village}, ${block} में ${problem} के संबंध में प्रार्थना पत्र।

महोदय/महोदया,

मैं ${name} (मोबाइल: ${mobile}), ग्राम/मोहल्ला ${village}, ब्लॉक ${block}, जनपद ${district} का निवासी हूँ। मैं निम्नलिखित समस्या की ओर आपका ध्यान आकर्षित करना चाहता/चाहती हूँ।

${resolvedDetails}${priorBlock}

अतः आपसे अनुरोध है कि स्थल का निरीक्षण कराकर समस्या का शीघ्र समाधान कराएं तथा की गई कार्यवाही से मुझे अवगत कराएं। कृपया इस प्रार्थना पत्र की प्राप्ति संख्या (डायरी नंबर) भी प्रदान करें।

धन्यवाद।

दिनांक: ${formattedDate}
नाम: ${name}
मोबाइल: ${mobile}${ccBlock}`;
  }

  return `To,
The ${designation},
${block}, District ${district}

Subject: Complaint about ${problem} in ${village}, ${block}

Respected Sir or Madam,

I, ${name} (mobile: ${mobile}), live in ${village}, ${block}, District ${district}. I am writing to bring the following problem to your attention.

${resolvedDetails}${priorBlock}

I request that you inspect the site, fix the problem as soon as possible, and tell me what action was taken. Please give me a diary or receipt number for this application.

Thank you.

Date: ${formattedDate}
Name: ${name}
Mobile: ${mobile}${ccBlock}`;
}
