/**
 * Shared validation and schemas for UP Civic Grievance Helper
 */

export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const UP_PINCODE_REGEX = /^2[0-8][0-9]{4}$/;

export const PROBLEM_CATEGORIES = [
  'road',
  'drainage',
  'water',
  'lights',
  'sanitation',
  'funds'
];

export const AREA_TYPES = ['village', 'town', 'city'];

export const CONTACT_STATUSES = [
  'verified',
  'from_district_website',
  'single_source',
  'conflicting',
  'check_before_use',
  'stale',
  'not_verified'
];

export const REPORT_KINDS = [
  'wrong_number',
  'no_answer',
  'transferred',
  'wrong_email',
  'other'
];

/**
 * Validates report submission payload
 */
export function validateReportPayload(data) {
  const errors = {};
  if (!data.officeId || typeof data.officeId !== 'string') {
    errors.officeId = 'Valid office ID is required.';
  }
  if (!data.kind || !REPORT_KINDS.includes(data.kind)) {
    errors.kind = `Report kind must be one of: ${REPORT_KINDS.join(', ')}`;
  }
  if (data.note && (typeof data.note !== 'string' || data.note.length > 300)) {
    errors.note = 'Note must not exceed 300 characters.';
  }
  if (!data.challenge || typeof data.challenge !== 'object') {
    errors.challenge = 'Proof of work challenge response is required.';
  } else {
    if (!data.challenge.nonce || typeof data.challenge.nonce !== 'string') {
      errors.challenge = 'Challenge nonce is required.';
    }
    if (typeof data.challenge.answer !== 'number') {
      errors.challenge = 'Challenge answer is required.';
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates step 1 state
 */
export function validateStep1(data, i18n = {}) {
  const errors = {};
  const cat = data.category || '';
  if (!cat.trim() || !PROBLEM_CATEGORIES.includes(cat.trim())) {
    errors.category = i18n.err_category_required || 'Please select a civic problem category.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates step 2 state (supports both data.district/districtSlug and data.block/blockName)
 */
export function validateStep2(data, i18n = {}) {
  const errors = {};
  const district = (data.district || data.districtSlug || data.districtName || '').trim();
  const block = (data.block || data.blockName || data.blockSlug || '').trim();
  const village = (data.village || '').trim();

  if (!district) {
    errors.district = i18n.err_district_required || 'Please select your district.';
  }
  if (!block) {
    errors.block = i18n.err_block_required || 'Please enter or select your block / town name.';
  }
  if (!village) {
    errors.village = i18n.err_village_required || 'Please enter your village, locality, or ward name.';
  } else if (village.length > 80) {
    errors.village = 'Village / locality name must not exceed 80 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates step 3 state (supports name/applicantName and mobile/applicantMobile)
 */
export function validateStep3(data, i18n = {}) {
  const errors = {};
  const name = (data.name || data.applicantName || '').trim();
  const mobile = (data.mobile || data.applicantMobile || '').trim();
  const details = (data.details || '').trim();

  if (!name) {
    errors.name = i18n.err_name_required || 'Please enter your full name.';
  } else if (name.length > 80) {
    errors.name = 'Name must not exceed 80 characters.';
  }

  if (!mobile || !MOBILE_REGEX.test(mobile)) {
    errors.mobile = i18n.err_mobile_invalid || 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
  }

  if (!details) {
    errors.details = i18n.err_details_required || 'Please provide details about the problem.';
  } else if (details.length > 1500) {
    errors.details = 'Problem details must not exceed 1500 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Escapes HTML characters to prevent XSS
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
