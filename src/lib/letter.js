/**
 * Pure function to format formal dates
 * English: 23 November 2026
 * Hindi: 23 नवंबर 2026
 */
const HINDI_MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatDate(dateObj = new Date(), lang = 'en') {
  const d = dateObj.getDate();
  const m = dateObj.getMonth();
  const y = dateObj.getFullYear();
  if (lang === 'hi') {
    return `${d} ${HINDI_MONTHS[m]} ${y}`;
  }
  return `${d} ${ENGLISH_MONTHS[m]} ${y}`;
}

const CATEGORY_MAP = {
  road: { en: 'Road and paving', hi: 'सड़क और खड़ंजा' },
  drainage: { en: 'Drainage and waterlogging', hi: 'नाली और जलभराव' },
  water: { en: 'Drinking water', hi: 'पेयजल' },
  light: { en: 'Street lights', hi: 'स्ट्रीट लाइट' },
  garbage: { en: 'Garbage and sanitation', hi: 'सफाई और कूड़ा' },
  audit: { en: 'Public works and funds', hi: 'विकास कार्य और धन' }
};

/**
 * Builds the complaint letter as a pure function.
 * @param {Object} params
 * @param {'en'|'hi'} [params.lang='en']
 * @param {Object} params.officer - Officer details (designation, designation_hi, ccList, ccList_hi)
 * @param {Object} params.applicant - Applicant details (name, mobile)
 * @param {Object} params.location - Location details (village, block, district)
 * @param {string} params.category - Category key (road, drainage, water, light, garbage, audit)
 * @param {string} params.details - Detailed problem description
 * @param {string} [params.prior] - Optional prior report note
 * @param {string} [params.date] - Optional formatted date string
 * @returns {string} The formatted letter
 */
export function buildLetter({
  lang = 'en',
  officer = {},
  applicant = {},
  location = {},
  category = 'road',
  details = '',
  prior = '',
  date = ''
}) {
  const formattedDate = date || formatDate(new Date(), lang);
  const name = (applicant.name || '').trim() || (lang === 'hi' ? '[आपका नाम]' : '[Your Name]');
  const mobile = (applicant.mobile || '').trim() || (lang === 'hi' ? '[मोबाइल नंबर]' : '[Mobile Number]');
  const village = (location.village || '').trim() || (lang === 'hi' ? '[ग्राम/मोहल्ला]' : '[Village/Locality]');
  const block = (location.block || '').trim() || (lang === 'hi' ? '[ब्लॉक/कस्बा]' : '[Block/Town]');
  const district = (location.district || '').trim() || (lang === 'hi' ? '[जनपद]' : '[District]');
  const catObj = CATEGORY_MAP[category] || { en: category, hi: category };

  if (lang === 'hi') {
    const designationHi = officer.designation_hi || officer.designation || 'खंड विकास अधिकारी (BDO)';
    const problemHi = catObj.hi;
    const priorLine = prior && prior.trim() ? `\nपूर्व सूचना: ${prior.trim()}\n` : '';
    const ccList = (officer.ccList_hi || officer.ccList || ['मुख्य विकास अधिकारी (CDO)', 'जिला पंचायत राज अधिकारी (DPRO)', 'जिलाधिकारी (DM)']).join(', ');

    return `सेवा में,
श्रीमान ${designationHi},
${block}, जनपद ${district}

विषय: ${village}, ${block} में ${problemHi} के संबंध में प्रार्थना पत्र।

महोदय/महोदया,

मैं ${name} (मोबाइल: ${mobile}), ग्राम/मोहल्ला ${village}, ब्लॉक ${block}, जनपद ${district} का निवासी हूँ। मैं निम्नलिखित समस्या की ओर आपका ध्यान आकर्षित करना चाहता/चाहती हूँ।

${(details || '').trim()}
${priorLine}
अतः आपसे अनुरोध है कि स्थल का निरीक्षण कराकर समस्या का शीघ्र समाधान कराएं तथा की गई कार्यवाही से मुझे अवगत कराएं। कृपया इस प्रार्थना पत्र की प्राप्ति संख्या (डायरी नंबर) भी प्रदान करें।

धन्यवाद।

दिनांक: ${formattedDate}
नाम: ${name}
मोबाइल: ${mobile}

प्रतिलिपि: ${ccList}`;
  }

  // English
  const designation = officer.designation || 'Block Development Officer (BDO)';
  const problem = catObj.en;
  const priorLine = prior && prior.trim() ? `\nPrior communication: ${prior.trim()}\n` : '';
  const ccList = (officer.ccList || ['Chief Development Officer (CDO)', 'District Panchayat Raj Officer (DPRO)', 'District Magistrate (DM)']).join(', ');

  return `To,
The ${designation},
${block}, District ${district}

Subject: Complaint about ${problem} in ${village}, ${block}

Respected Sir or Madam,

I, ${name} (mobile: ${mobile}), live in ${village}, ${block}, District ${district}. I am writing to bring the following problem to your attention.

${(details || '').trim()}
${priorLine}
I request that you inspect the site, fix the problem as soon as possible, and tell me what action was taken. Please give me a diary or receipt number for this application.

Thank you.

Date: ${formattedDate}
Name: ${name}
Mobile: ${mobile}

Copy to: ${ccList}`;
}
