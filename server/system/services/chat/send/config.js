// @ts-nocheck
import { getServerSettings } from "../../settings/index.js";

const getChatRunConfig = (input = {}) => {
  const settings = getServerSettings();
  const config = {
    apiUrl: input.apiUrl || settings.apiUrl || "",
    apiKey: input.apiKey || settings.apiKey || "",
    model: input.model || settings.model || "",
    provider: input.provider || settings.provider || "",
    system: input.system || settings.system || "",
    contextTurns: input.contextTurns ?? settings.contextTurns ?? 100,
  };

  const missing = [];
  if (!config.apiUrl) missing.push("apiUrl");
  if (!config.apiKey) missing.push("apiKey");
  if (!config.model) missing.push("model");
  if (missing.length > 0) {
    const error = new Error("还没有配置模型。请先到设置里填写模型供应方、模型名称和 API Key，然后再发送消息。");
    error.code = "model_settings_missing";
    error.missing = missing;
    throw error;
  }

  return config;
};

export { getChatRunConfig };
