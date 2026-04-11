import { saveSetting } from "../../repository/settings/save.js";
import { applyLanguage } from "../../system/language.js";
import { buildFrontend } from "./reload.js";
const completeInstall = (language) => {
  applyLanguage(language);
  saveSetting("language", language);
  buildFrontend();
};
export {
  completeInstall
};
