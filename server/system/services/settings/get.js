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
      contextTurns: Number.isInteger(Number(settings.contextTurns)) ? Number(settings.contextTurns) : 100,
    };
  } catch {
    return {
      apiUrl: "",
      apiKey: "",
      model: "",
      system: DEFAULT_SYSTEM_PROMPT,
      contextTurns: 100
    };
  }
};

export { getServerSettings };
