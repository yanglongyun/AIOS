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

const normalizeLocale = (nextLocale) => {
  const value = String(nextLocale || '').trim();
  if (value !== 'zh' && value !== 'en') {
    throw new Error(`Invalid locale: ${value}`);
  }
  return value;
};

export const setLocale = (nextLocale) => {
  locale.value = normalizeLocale(nextLocale);
  localStorage.setItem(LOCALE_KEY, locale.value);
  document.documentElement.setAttribute('lang', locale.value === 'en' ? 'en' : 'zh-CN');
};

export const initI18n = () => {
  setLocale(locale.value);
};

export const t = (key, params = {}) => {
  const dict = messages[locale.value];
  if (!dict) {
    throw new Error(`Unsupported locale: ${locale.value}`);
  }
  if (!(key in dict)) {
    throw new Error(`Missing i18n key: ${key} for locale ${locale.value}`);
  }
  let text = dict[key];
  for (const [k, v] of Object.entries(params || {})) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
};

export const useI18n = () => ({ locale, setLocale, t });
