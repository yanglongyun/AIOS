import { listSettingRows } from "../../repository/settings/get.js";

const readSettingsMap = () => {
  const rows = listSettingRows();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
};

const normalizeContextRounds = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 100;
  if (num <= 100) return 100;
  if (num <= 500) return 500;
  return 1000;
};

const hasConfiguredModelSettings = () => {
  const obj = readSettingsMap();
  const model = String(obj.model || "").trim();
  const apiUrl = String(obj.apiUrl || "").trim();
  const apiKey = String(obj.apiKey || "").trim();
  return Boolean(model && apiUrl && apiKey);
};

const getSettings = () => {
  const obj = readSettingsMap();
  const toolResultMaxChars = Math.max(1e3, Math.min(5e4, Number(obj.toolResultMaxChars) || 12e3));
  const toolMaxRounds = Math.max(1, Math.min(500, Number(obj.toolMaxRounds) || 50));
  const settings = {
    systemPrompt: obj.systemPrompt || "",
    contextRounds: normalizeContextRounds(obj.contextRounds),
    apiUrl: obj.apiUrl || "https://api.openai.com/v1/chat/completions",
    apiKey: obj.apiKey || "",
    model: obj.model || "gpt-5.4",
    enableToolResultTruncate: obj.enableToolResultTruncate === void 0 ? true : obj.enableToolResultTruncate === "1",
    toolResultMaxChars,
    enableToolLoopLimit: obj.enableToolLoopLimit === void 0 ? true : obj.enableToolLoopLimit === "1",
    toolMaxRounds
  };
  return settings;
};
export {
  getSettings,
  hasConfiguredModelSettings,
  normalizeContextRounds
};
