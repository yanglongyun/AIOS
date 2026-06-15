// @ts-nocheck
import { getSettingsRecord } from "../../repository/settings/index.js";
import { DEFAULT_SYSTEM_PROMPT } from "../prompt/identity.js";

const getServerSettings = () => {
  try {
    const settings = getSettingsRecord();
    return {
      apiUrl: settings.apiUrl || "",
      apiKey: settings.apiKey || "",
      model: settings.model || "",
      system: settings.system || DEFAULT_SYSTEM_PROMPT,
      compressThreshold: Number.isFinite(Number(settings.compressThreshold)) ? Number(settings.compressThreshold) : 12000,
      compactPrompt: settings.compactPrompt || "",
      toolResultMaxChars: Number.isFinite(Number(settings.toolResultMaxChars)) ? Number(settings.toolResultMaxChars) : 12000,
    };
  } catch {
    return {
      apiUrl: "",
      apiKey: "",
      model: "",
      system: DEFAULT_SYSTEM_PROMPT,
      compressThreshold: 12000,
      compactPrompt: "",
      toolResultMaxChars: 12000,
    };
  }
};

export { getServerSettings };
