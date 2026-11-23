/**
 * i18n helper
 */

export function detectBrowserLanguage() {
  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('hi')) {
      return 'hi';
    }
  }
  return 'en';
}

export function getCurrentLang() {
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang === 'hi' || htmlLang === 'en') return htmlLang;
    if (window.location.pathname.startsWith('/hi')) return 'hi';
  }
  return 'en';
}
