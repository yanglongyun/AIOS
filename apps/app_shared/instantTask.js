import { parseJsonObject } from '../../shared/ai/json.js';

const requestTask = async (body = {}) => {
  let resp;
  try {
    resp = await fetch('http://localhost:9700/api/task/create/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(`task service unreachable: ${err.message}`);
  }
  let data;
  try { data = await resp.json(); } catch { data = {}; }
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }
  return data;
};

export const instantTask = async ({
  app,
  title,
  prompt = '',
  schema = null,
  messages = null,
  tools = null,
  tool_choice = undefined,
  parallel_tool_calls = undefined,
  meta = null
}) => {
  return await requestTask({
    app,
    title,
    prompt,
    schema,
    messages,
    tools,
    tool_choice,
    parallel_tool_calls,
    meta
  });
};

export const instantTaskJson = async (args = {}) => {
  const data = await instantTask(args);
  return parseJsonObject(data.response || '');
};
