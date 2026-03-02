import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { getSettings } from '../../db/settings.js';
import { callLLM } from '../../agent/llm.js';

export const handleLlmChat = async (req, res) => {
  const body = await readBody(req);
  const { messages, model: bodyModel, response_format, tools } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json(res, { success: false, message: 'messages 不能为空' }, 400);
  }

  const settings = getSettings();
  const { apiUrl, apiKey, provider, model: defaultModel } = settings;
  const model = bodyModel || defaultModel;

  try {
    const payload = { model, messages };
    if (response_format) payload.response_format = response_format;
    if (tools) payload.tools = tools;
    const message = await callLLM(provider, apiUrl, apiKey, payload);
    json(res, { success: true, message });
  } catch (e) {
    json(res, { success: false, message: e.message }, 500);
  }
};
