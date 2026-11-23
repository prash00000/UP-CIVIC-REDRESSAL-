/**
 * Officer resolution, lookup and status management
 */

const MAINTAINER_EMAIL = 'support@upcivic.in';
const districtCache = new Map();

/**
 * Checks if a date string is older than 6 months (approx 180 days)
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
export function isStale(dateStr) {
  if (!dateStr) return true;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return true;
  const now = new Date();
  const diffDays = (now - parsed) / (1000 * 60 * 60 * 24);
  return diffDays > 180;
}

/**
 * Normalizes status based on data and age
 */
export function determineStatus(record) {
  if (!record || (!record.phone && !record.email) || record.status === 'not_verified') {
    return 'not_verified';
  }
  if (record.status === 'conflicting') {
    return 'conflicting';
  }
  if (isStale(record.checked)) {
    return 'check_before_use';
  }
  if (record.status === 'verified') {
    return 'verified';
  }
  if (record.status === 'from_district_website') {
    return 'from_district_website';
  }
  return 'single_source';
}

/**
 * Fetches lookup data for a district with caching
 */
export async function getDistrictLookup(districtSlug, fetchFn = fetch) {
  if (districtCache.has(districtSlug)) {
    return districtCache.get(districtSlug);
  }
  try {
    const res = await fetchFn(`/data/lookup/${districtSlug}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load lookup data for ${districtSlug}: ${res.status}`);
    }
    const data = await res.json();
    districtCache.set(districtSlug, data);
    return data;
  } catch (err) {
    console.warn('Lookup fetch error:', err);
    return null;
  }
}

/**
 * Resolves the designated officer and CC list based on area type and problem.
 * @param {Object} params
 * @param {string} params.areaType - 'village' | 'town' | 'city'
 * @param {string} params.districtSlug
 * @param {string} params.districtName
 * @param {string} params.districtNameHi
 * @param {string} params.blockSlug
 * @param {string} params.blockName
 * @param {string} params.blockNameHi
 * @param {string} params.category
 * @param {boolean} params.isPwdRoad
 * @param {Object} [params.lookupData]
 * @returns {Object} Resolved officer details
 */
export function resolveOfficer({
  areaType = 'village',
  districtSlug = '',
  districtName = '',
  districtNameHi = '',
  blockSlug = '',
  blockName = '',
  blockNameHi = '',
  category = 'road',
  isPwdRoad = false,
  lookupData = null
}) {
  const normDistSlug = (districtSlug || '').toLowerCase().trim();
  const normBlockSlug = (blockSlug || '').toLowerCase().trim();
  const dName = districtName || normDistSlug;
  const dNameHi = districtNameHi || dName;
  const bName = blockName || normBlockSlug;
  const bNameHi = blockNameHi || bName;

  let designationKey = 'bdo';
  let defaultDesignation = 'Block Development Officer (BDO)';
  let defaultDesignationHi = 'खंड विकास अधिकारी (BDO)';
  let defaultOffice = `Block Development Office, ${bName}, District ${dName}`;
  let defaultOfficeHi = `विकास खंड कार्यालय, ${bNameHi}, जनपद ${dNameHi}`;
  let ccList = ['Chief Development Officer (CDO)', 'District Panchayat Raj Officer (DPRO)', 'District Magistrate (DM)'];
  let ccListHi = ['मुख्य विकास अधिकारी (CDO)', 'जिला पंचायत राज अधिकारी (DPRO)', 'जिलाधिकारी (DM)'];

  if (category === 'road' && isPwdRoad) {
    designationKey = 'ee-pwd';
    defaultDesignation = 'Executive Engineer, PWD Provincial Division';
    defaultDesignationHi = 'अधिशासी अभियंता, लो०नि०वि० प्रांतीय खंड';
    defaultOffice = `PWD Provincial Division, District ${dName}`;
    defaultOfficeHi = `लो०नि०वि० प्रांतीय खंड, जनपद ${dNameHi}`;
    ccList = ['Chief Development Officer (CDO)', 'District Magistrate (DM)'];
    ccListHi = ['मुख्य विकास अधिकारी (CDO)', 'जिलाधिकारी (DM)'];
  } else if (areaType === 'town') {
    designationKey = 'eo';
    defaultDesignation = 'Executive Officer, Nagar Palika / Panchayat';
    defaultDesignationHi = 'अधिशासी अधिकारी, नगर पालिका / नगर पंचायत';
    defaultOffice = `Nagar Palika Parishad / Panchayat Office, ${bName}, District ${dName}`;
    defaultOfficeHi = `नगर पालिका परिषद / पंचायत कार्यालय, ${bNameHi}, जनपद ${dNameHi}`;
    ccList = ['District Magistrate (DM)'];
    ccListHi = ['जिलाधिकारी (DM)'];
  } else if (areaType === 'city') {
    designationKey = 'commissioner';
    defaultDesignation = 'Municipal Commissioner, Nagar Nigam';
    defaultDesignationHi = 'नगर आयुक्त, नगर निगम';
    defaultOffice = `Nagar Nigam, District ${dName}`;
    defaultOfficeHi = `नगर निगम, जनपद ${dNameHi}`;
    ccList = ['District Magistrate (DM)', 'Divisional Commissioner'];
    ccListHi = ['जिलाधिकारी (DM)', 'मंडलायुक्त'];
  }

  // Lookup record from JSON
  let record = null;
  if (lookupData) {
    if (designationKey === 'ee-pwd' || designationKey === 'ee-pmgsy') {
      record = lookupData[`${normDistSlug}|_district|${designationKey}`];
    } else if (areaType === 'city') {
      record = lookupData[`${normDistSlug}|_city|commissioner`] || lookupData[`${normDistSlug}|_district|commissioner`];
    } else {
      record = lookupData[`${normDistSlug}|${normBlockSlug}|${designationKey}`];
    }
  }

  const status = determineStatus(record);
  const checked = record?.checked || '2026-11-20';
  const source = record?.source || (normDistSlug ? `https://${normDistSlug}.nic.in/whos-who/` : 'https://up.gov.in');
  const recordId = `${normDistSlug}|${normBlockSlug}|${designationKey}`;
  const reportEmail = `mailto:${MAINTAINER_EMAIL}?subject=Report%20Wrong%20Number%20[${encodeURIComponent(recordId)}]&body=Please%20specify%20the%20correct%20number%20or%20source%20for%20${encodeURIComponent(recordId)}:`;

  return {
    key: recordId,
    areaType,
    designationKey,
    designation: record?.designation || defaultDesignation,
    designation_hi: record?.designation_hi || defaultDesignationHi,
    office: record?.office || defaultOffice,
    office_hi: record?.office_hi || defaultOfficeHi,
    phone: record?.phone || '',
    email: record?.email || '',
    status,
    checked,
    source,
    reportEmail,
    warning: record?.warning || (status === 'conflicting' ? 'Conflicting telephone directory entries reported for this office.' : ''),
    ccList,
    ccList_hi: ccListHi
  };
}
