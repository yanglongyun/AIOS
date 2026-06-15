// @ts-nocheck
import { getServerSettings } from "../../settings/index.js";

const getChatRunConfig = (input = {}) => {
  const settings = getServerSettings();
  const config = {
    apiUrl: input.apiUrl || settings.apiUrl || "",
    apiKey: input.apiKey || settings.apiKey || "",
    model: input.model || settings.model || "",
    system: input.system || settings.system || "",
    compressThreshold: input.compressThreshold ?? settings.compressThreshold ?? 12000,
    compactPrompt: input.compactPrompt ?? settings.compactPrompt ?? "",
    toolResultMaxChars: input.toolResultMaxChars ?? settings.toolResultMaxChars ?? 12000,
  };

  const missing = [];
  if (!config.apiUrl) missing.push("apiUrl");
  if (!config.apiKey) missing.push("apiKey");
  if (!config.model) missing.push("model");
  if (missing.length > 0) {
    const error = new Error("还没有配置模型。请先到设置里填写请求地址、模型名称和 API Key，然后再发送消息。");
    error.code = "model_settings_missing";
    error.missing = missing;
    throw error;
  }

  return config;
};

export { getChatRunConfig };
