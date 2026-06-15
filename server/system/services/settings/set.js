// @ts-nocheck
import { setSettingsRecord } from "../../repository/settings/index.js";

const setServerSettings = (settings) => {
  setSettingsRecord({
    apiUrl: settings.apiUrl || "",
    apiKey: settings.apiKey || "",
    model: settings.model || "",
    system: settings.system || "",
    compressThreshold: Math.max(0, Number(settings.compressThreshold) || 0),
    compactPrompt: settings.compactPrompt || "",
    toolResultMaxChars: Math.max(1000, Math.min(50000, Number(settings.toolResultMaxChars) || 12000)),
  });
};

export { setServerSettings };
