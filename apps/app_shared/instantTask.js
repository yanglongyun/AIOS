import { parseJsonObject } from '../../shared/ai/json.js';

const requestTask = async (body = {}, req) => {
  const cookie = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
  const resp = await fetch('http://localhost:9700/api/task/create/instant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
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
  req,
  messages = null,
  tools = null,
  tool_choice = undefined,
  parallel_tool_calls = undefined,
  response_format = undefined,
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
    response_format,
    meta
  }, req);
};

export const instantTaskJson = async (args = {}) => {
  const data = await instantTask(args);
  return parseJsonObject(data.response || '');
};
