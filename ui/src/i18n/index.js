import { ref } from 'vue';
import zhMessages from './messages/zh/index.js';
import enMessages from './messages/en/index.js';

const LOCALE_KEY = 'aios.locale';
const detectLocale = () => {
  const lang = String(navigator.language || '').toLowerCase();
  return lang.startsWith('zh') ? 'zh' : 'en';
};
const defaultLocale = detectLocale();

export const locale = ref(localStorage.getItem(LOCALE_KEY) || defaultLocale);

const messages = { zh: zhMessages, en: enMessages };

const normalizeLocale = (nextLocale) => (nextLocale === 'en' ? 'en' : 'zh');

export const setLocale = (nextLocale) => {
  locale.value = normalizeLocale(nextLocale);
  localStorage.setItem(LOCALE_KEY, locale.value);
  document.documentElement.setAttribute('lang', locale.value === 'en' ? 'en' : 'zh-CN');
};

export const initI18n = () => {
  setLocale(locale.value);
};

export const t = (key, params = {}) => {
  const dict = messages[locale.value] || messages[defaultLocale];
  const fallback = messages[defaultLocale];
  let text = dict[key] ?? fallback[key] ?? key;
  for (const [k, v] of Object.entries(params || {})) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
};

export const useI18n = () => ({ locale, setLocale, t });
