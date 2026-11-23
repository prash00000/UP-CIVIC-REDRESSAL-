/**
 * Input validation library
 */

export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;

export function validateStep1(data, i18n = {}) {
  const errors = {};
  if (!data.category || !data.category.trim()) {
    errors.category = i18n.err_category_required || 'Please select a civic problem category.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateStep2(data, i18n = {}) {
  const errors = {};
  if (!data.district || !data.district.trim()) {
    errors.district = i18n.err_district_required || 'Please select your district.';
  }
  if (!data.block || !data.block.trim()) {
    errors.block = i18n.err_block_required || 'Please enter or select your block / town name.';
  }
  if (!data.village || !data.village.trim()) {
    errors.village = i18n.err_village_required || 'Please enter your village, locality, or ward name.';
  } else if (data.village.trim().length > 80) {
    errors.village = 'Village / locality name must not exceed 80 characters.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateStep3(data, i18n = {}) {
  const errors = {};
  if (!data.name || !data.name.trim()) {
    errors.name = i18n.err_name_required || 'Please enter your full name.';
  } else if (data.name.trim().length > 80) {
    errors.name = 'Name must not exceed 80 characters.';
  }

  const mobileClean = (data.mobile || '').trim();
  if (!mobileClean || !MOBILE_REGEX.test(mobileClean)) {
    errors.mobile = i18n.err_mobile_invalid || 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
  }

  if (!data.details || !data.details.trim()) {
    errors.details = i18n.err_details_required || 'Please provide details about the problem.';
  } else if (data.details.trim().length > 1500) {
    errors.details = 'Problem details must not exceed 1500 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Escapes HTML characters to prevent XSS.
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
