import { setLocaleLanguage } from './locale.js';

const normalizeTheme = (value) => (value === 'dark' ? 'dark' : 'light');
const normalizeLanguage = (value) => (value === 'en' ? 'en' : 'zh');

const applyTheme = (value) => {
  const theme = normalizeTheme(value);
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('agent:theme', theme);
  return theme;
};

const applyLanguage = (value) => {
  const language = normalizeLanguage(value);
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  localStorage.setItem('agent:language', language);
  setLocaleLanguage(language);
  return language;
};

const applyAppearance = ({ theme, language } = {}) => {
  applyTheme(theme || localStorage.getItem('agent:theme') || 'light');
  applyLanguage(language || localStorage.getItem('agent:language') || 'zh');
};

const loadAppearance = async () => {
  applyAppearance();
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    applyAppearance(settings);
  } catch {
    // Local defaults are enough when the API is not ready.
  }
};

export { applyAppearance, applyLanguage, applyTheme, loadAppearance, normalizeLanguage, normalizeTheme };
