// @ts-nocheck
import { getServerSettings } from "../settings/index.js";

const getChatRunConfig = (input = {}) => {
  const settings = getServerSettings();
  const config = {
    apiUrl: input.apiUrl || settings.apiUrl || "",
    apiKey: input.apiKey || settings.apiKey || "",
    model: input.model || settings.model || "",
    system: input.system || settings.system || "",
    compressThreshold: input.compressThreshold ?? settings.compressThreshold ?? 12000,
    compactPrompt: input.compactPrompt ?? settings.compactPrompt ?? "",
    maxRounds: input.maxRounds ?? settings.maxRounds ?? 50,
    toolResultMaxChars: input.toolResultMaxChars ?? settings.toolResultMaxChars ?? 12000,
  };
  const missing = [];
  if (!config.apiUrl) missing.push("apiUrl");
  if (!config.apiKey) missing.push("apiKey");
  if (!config.model) missing.push("model");
  if (missing.length) throw new Error(`Missing required settings: ${missing.join(", ")}`);
  return config;
};

export { getChatRunConfig };
