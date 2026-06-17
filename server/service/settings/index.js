// @ts-nocheck
import { deleteSettings, getSettings, setSettings } from "../../repository/settings/index.js";

const DEFAULTS = {
  apiUrl: process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions",
  apiKey: process.env.LLM_API_KEY || "",
  model: process.env.LLM_MODEL || "gpt-4.1-mini",
  system: process.env.AGENT_SYSTEM_PROMPT || "",
  compressThreshold: process.env.AGENT_COMPRESS_THRESHOLD || "12000",
  compactPrompt: process.env.AGENT_COMPACT_PROMPT || "",
  maxRounds: process.env.AGENT_MAX_ROUNDS || "50",
  toolResultMaxChars: process.env.AGENT_TOOL_RESULT_MAX_CHARS || "12000",
  theme: process.env.AGENT_THEME || "light",
  language: process.env.AGENT_LANGUAGE || "zh",
};

const allowedKeys = Object.keys(DEFAULTS);
const deprecatedKeys = ["provider"];

const pickKnownSettings = (settings = {}) => Object.fromEntries(
  allowedKeys
    .filter((key) => settings[key] != null)
    .map((key) => [key, settings[key]])
);

const getServerSettings = () => {
  deleteSettings(deprecatedKeys);
  return {
    ...DEFAULTS,
    ...pickKnownSettings(getSettings()),
  };
};

const normalizeSettingValue = (key, value) => {
  if (key === "maxRounds") {
    return String(Math.max(1, Math.min(100000, Number(value) || 50)));
  }
  if (key === "toolResultMaxChars") {
    return String(Math.max(1000, Math.min(50000, Number(value) || 12000)));
  }
  return String(value);
};

const updateServerSettings = (settings = {}) => {
  const next = {};
  for (const key of allowedKeys) {
    if (settings[key] != null) next[key] = normalizeSettingValue(key, settings[key]);
  }
  deleteSettings(deprecatedKeys);
  setSettings(next);
  return getServerSettings();
};

export { getServerSettings, updateServerSettings };
