import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { DEFAULT_SYSTEM_PROMPT } from "../../service/prompt/default.js";
import { buildSystemPrompt } from "../../service/prompt/index.js";
import { getSettings } from "../../service/settings/get.js";
import { updateSettings } from "../../service/settings/update.js";
import { callChatCompletion } from "../../ai/client.js";
import { listInstalledSkills } from "../../service/skills/list.js";

const normalizeModelConfig = (body = {}) => {
  const apiUrl = String(body.apiUrl || "").trim();
  const apiKey = String(body.apiKey || "").trim();
  const model = String(body.model || "").trim();
  if (!apiUrl) throw new Error("请求地址不能为空");
  if (!apiKey) throw new Error("模型 Key 不能为空");
  if (!model) throw new Error("模型不能为空");
  return { apiUrl, apiKey, model };
};

const testModelSettings = async (body = {}) => {
  const { apiUrl, apiKey, model } = normalizeModelConfig(body);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const result = await callChatCompletion(apiUrl, apiKey, {
      model,
      messages: [
        { role: "user", content: "请只回复：连接正常" }
      ]
    }, { signal: controller.signal });
    return {
      success: true,
      content: String(result.message?.content || "").trim(),
      usage: result.usage
    };
  } finally {
    clearTimeout(timer);
  }
};

const handleSettingsApi = async (req, res, path) => {
  if (path === "/api/settings" && req.method === "GET") {
    return json(res, getSettings());
  }
  if (path === "/api/settings" && req.method === "POST") {
    const body = await readBody(req);
    updateSettings(body);
    return json(res, getSettings());
  }
  if (path === "/api/settings/model-test" && req.method === "POST") {
    const body = await readBody(req);
    try {
      return json(res, await testModelSettings(body));
    } catch (error) {
      const message = error?.name === "AbortError" ? "模型测试超时" : error.message;
      return json(res, { success: false, message }, 400);
    }
  }

  if (path === "/api/settings/skills" && req.method === "GET") {
    return json(res, { success: true, items: listInstalledSkills() });
  }

  if (path === "/api/settings/prompt" && req.method === "GET") {
    const content = String(getSettings().systemPrompt || "").trim() || DEFAULT_SYSTEM_PROMPT;
    return json(res, { success: true, content });
  }
  if (path === "/api/settings/prompt/preview" && req.method === "POST") {
    const body = await readBody(req);
    return json(res, {
      success: true,
      content: buildSystemPrompt("", { instructionOverride: body.content })
    });
  }
  if (path === "/api/settings/prompt" && req.method === "POST") {
    const body = await readBody(req);
    const content = String(body.content || "").trim();
    if (!content) return json(res, { success: false, message: "content is required" }, 400);
    updateSettings({ systemPrompt: content });
    return json(res, { success: true });
  }

  return json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleSettingsApi
};
