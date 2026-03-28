import { saveSetting } from '../../repository/settings/save.ts';
import { applyLanguage } from '../../system/language.ts';
import { buildFrontend } from '../../system/reload.ts';

export const completeInstall = (language: string) => {
  applyLanguage(language);
  saveSetting('language', language);
  buildFrontend();
};
