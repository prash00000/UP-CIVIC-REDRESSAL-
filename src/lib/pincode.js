/**
 * In-browser offline-first PIN code resolution
 * Adheres strictly to ADDENDUM: PIN code detection
 */

const pinCache = new Map();

export function cleanPostOfficeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/\s+(Head Post Office|Sub Post Office|Branch Post Office)\b/gi, '')
    .replace(/\s+(H\.O|S\.O|B\.O|HO|SO|BO)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a 6-digit postal PIN code within Uttar Pradesh
 * @param {string} pin - 6 digit PIN string
 * @param {Function} [fetchFn] - fetch implementation
 * @returns {Promise<Object>}
 */
export async function lookupPincode(pin, fetchFn = (typeof fetch !== 'undefined' ? fetch : null)) {
  const cleanPin = String(pin || '').trim();

  if (!/^\d{6}$/.test(cleanPin)) {
    return {
      valid: false,
      error: 'Please enter a 6-digit numeric PIN code.'
    };
  }

  // Check UP range (starts with 20 to 28)
  const firstTwo = parseInt(cleanPin.slice(0, 2), 10);
  if (firstTwo < 20 || firstTwo > 28) {
    return {
      valid: false,
      notUp: true,
      message_en: "This doesn’t look like an Uttar Pradesh PIN code. Check the 6 digits or choose your district below.",
      message_hi: "यह उत्तर प्रदेश का पिन कोड प्रतीत नहीं होता। कृपया 6 अंक जांचें या नीचे अपना जनपद चुनें।"
    };
  }

  const prefix = cleanPin.slice(0, 3);
  let shard = pinCache.get(prefix);

  if (!shard && fetchFn) {
    try {
      const res = await fetchFn(`/data/pincode/${prefix}.json`);
      if (res.ok) {
        shard = await res.json();
        pinCache.set(prefix, shard);
      }
    } catch (err) {
      console.warn(`Failed to fetch PIN shard ${prefix}:`, err);
    }
  }

  if (!shard) {
    return {
      valid: false,
      networkError: true,
      message_en: "Unable to load PIN directory offline. Please choose your district manually below.",
      message_hi: "पिन डायरेक्टरी लोड करने में असमर्थ। कृपया नीचे अपना जनपद सीधे चुनें।"
    };
  }

  const record = shard[cleanPin];
  if (!record) {
    return {
      valid: false,
      notFound: true,
      message_en: `We couldn’t find PIN ${cleanPin}. Check the number or choose your district below.`,
      message_hi: `पिन कोड ${cleanPin} डायरेक्टरी में नहीं मिला। कृपया नंबर जांचें या नीचे जनपद चुनें।`
    };
  }

  const districts = record.d || [];
  const taluks = record.t || [];
  const postOffices = record.p || [];
  const localities = [...new Set(postOffices.map(cleanPostOfficeName).filter(Boolean))];
  const hasTownOffice = Boolean(record.u) || postOffices.some(p => p.includes('S.O') || p.includes('H.O'));

  if (districts.length > 1) {
    return {
      valid: true,
      isMultiDistrict: true,
      pin: cleanPin,
      districts,
      taluks,
      postOffices,
      localities,
      hasTownOffice,
      urbanBody: record.u || null,
      message_en: `This PIN covers more than one district: ${districts.join(', ')}. Choose yours below.`,
      message_hi: `यह पिन एक से अधिक जनपदों में आता है: ${districts.join(', ')}। कृपया नीचे अपना जनपद चुनें।`
    };
  }

  const districtSlug = districts[0];
  return {
    valid: true,
    isMultiDistrict: false,
    pin: cleanPin,
    districtSlug,
    districts,
    taluks,
    postOffices,
    localities,
    hasTownOffice,
    urbanBody: record.u || null,
    message_en: `PIN ${cleanPin} is in ${districtSlug} district. Check your block and village below.`,
    message_hi: `पिन कोड ${cleanPin} जनपद ${districtSlug} में है। नीचे अपना ब्लॉक व गाँव जांचें।`
  };
}
