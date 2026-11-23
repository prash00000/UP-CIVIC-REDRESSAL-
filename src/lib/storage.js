/**
 * Local storage manager with try/catch resilience
 */

const DRAFT_KEY = 'up_civic_draft_v1';
const THEME_KEY = 'up_civic_theme';
const LANG_KEY = 'up_civic_lang';

export function saveDraft(data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      return true;
    }
  } catch (e) {
    console.warn('localStorage saveDraft error:', e);
  }
  return false;
}

export function loadDraft() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('localStorage loadDraft error:', e);
  }
  return null;
}

export function clearDraft() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(DRAFT_KEY);
      return true;
    }
  } catch (e) {
    console.warn('localStorage clearDraft error:', e);
  }
  return false;
}

export function saveTheme(theme) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, theme);
    }
  } catch (e) {}
}

export function loadTheme() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(THEME_KEY) || 'system';
    }
  } catch (e) {}
  return 'system';
}

export function saveLang(lang) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANG_KEY, lang);
    }
  } catch (e) {}
}

export function loadLang() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(LANG_KEY) || '';
    }
  } catch (e) {}
  return '';
}
