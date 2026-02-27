import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { getSettings } from '../settings/get.js';
import { callLLM } from '../../agent/llm.js';

export const handleLlmChat = async (req, res) => {
  const body = await readBody(req);
  const { messages, model: bodyModel } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json(res, { success: false, message: 'messages 不能为空' }, 400);
  }

  const settings = getSettings();
  const { apiUrl, apiKey, model: defaultModel } = settings;
  const model = bodyModel || defaultModel;

  try {
    const message = await callLLM({ messages, model, apiUrl, apiKey });
    json(res, { success: true, message });
  } catch (e) {
    json(res, { success: false, message: e.message }, 500);
  }
};
