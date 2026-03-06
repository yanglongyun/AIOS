import { callLlmRegular } from '../../../llm/regular.js';
import { randomUUID } from 'crypto';
import { db } from '../../../db/client.js';
import { getSettings } from '../../../db/settings.js';
import { broadcast } from '../../../system/ws.js';
import { readBody } from '../../../../shared/http/readBody.js';
import { json } from '../../../../shared/http/json.js';
import { parseJsonObject, validateBySchema } from '../../../../shared/ai/json.js';

export const runInstantTask = async ({
  prompt,
  schema,
  provider,
  apiUrl,
  apiKey,
  model,
  messages,
  tools,
  tool_choice,
  parallel_tool_calls,
  response_format,
  signal
}) => {
  const hasMessages = Array.isArray(messages) && messages.length > 0;
  const payload = {
    model,
    messages: hasMessages ? messages : [
      {
        role: 'system',
        content: '你是一个结构化任务执行器。严格按要求输出，不要输出额外解释。'
      },
      {
        role: 'user',
        content: schema
          ? `${prompt}\n\n输出必须是 JSON，对应 schema：${JSON.stringify(schema)}`
          : prompt
      }
    ]
  };
  if (Array.isArray(tools) && tools.length) payload.tools = tools;
  if (tool_choice !== undefined) payload.tool_choice = tool_choice;
  if (parallel_tool_calls !== undefined) payload.parallel_tool_calls = parallel_tool_calls;
  if (response_format) payload.response_format = response_format;
  else if (schema) payload.response_format = { type: 'json_object' };

  const assistant = await callLlmRegular(provider, apiUrl, apiKey, payload, signal);
  const content = String(assistant?.content || '').trim();

  if (Array.isArray(assistant?.tool_calls) && assistant.tool_calls.length > 0) {
    return JSON.stringify({
      content,
      tool_calls: assistant.tool_calls
    });
  }

  if (schema || payload.response_format?.type === 'json_object') {
    const parsed = parseJsonObject(content);
    validateBySchema(parsed, schema);
    return JSON.stringify(parsed);
  }

  return content;
};

const runningInstantTaskControllers = new Map();

export const stopInstantTaskExecution = (taskId) => {
  const controller = runningInstantTaskControllers.get(taskId);
  if (!controller) return false;
  controller.abort();
  return true;
};

const saveMessage = (conversationId, msg, meta = null) => {
  db.prepare('INSERT INTO messages (conversation_id, message, meta) VALUES (?, ?, ?)').run(
    conversationId,
    JSON.stringify(msg),
    meta ? JSON.stringify(meta) : null
  );
};

const createInstantTaskRecord = ({
  app,
  title,
  prompt,
  schema = null,
  meta = null
}) => {
  const conversationId = `task:${randomUUID().slice(0, 8)}`;
  const row = db.prepare(
    "INSERT INTO tasks (conversation_id, app, title, mode, prompt, schema, meta, status) VALUES (?, ?, ?, 'instant', ?, ?, ?, 'pending') RETURNING id"
  ).get(
    conversationId,
    app,
    String(title || ''),
    prompt,
    schema ? JSON.stringify(schema) : null,
    meta ? JSON.stringify(meta) : null
  );
  broadcast({ type: 'tasks_changed' });
  return { conversationId, taskId: row.id };
};

const finalizeInstantTaskSuccess = ({ taskId, conversationId, response }) => {
  saveMessage(conversationId, { role: 'assistant', content: response }, null);
  db.prepare(
    "UPDATE tasks SET response = ?, status = 'done', finished_at = datetime('now') WHERE id = ?"
  ).run(response, taskId);
  broadcast({ type: 'tasks_changed' });
  return { id: taskId, conversationId, response };
};

const finalizeInstantTaskError = ({ taskId, error }) => {
  if (error?.name === 'AbortError') {
    db.prepare(
      "UPDATE tasks SET error = '用户终止任务', status = 'aborted', finished_at = datetime('now') WHERE id = ?"
    ).run(taskId);
  } else {
    db.prepare(
      "UPDATE tasks SET error = ?, status = 'error', finished_at = datetime('now') WHERE id = ?"
    ).run(error?.message || '任务执行失败', taskId);
  }
  broadcast({ type: 'tasks_changed' });
};

export const createInstantTask = async ({
  app,
  title = '',
  prompt,
  schema = null,
  meta = null,
  messages = null,
  tools = null,
  tool_choice = undefined,
  parallel_tool_calls = undefined,
  response_format = undefined
}) => {
  const { apiUrl, apiKey, model, provider } = getSettings();
  const { conversationId, taskId } = createInstantTaskRecord({
    app,
    title,
    prompt,
    schema,
    meta
  });

  const abortController = new AbortController();
  runningInstantTaskControllers.set(taskId, abortController);

  try {
    const response = await runInstantTask({
      prompt,
      schema,
      provider,
      apiUrl,
      apiKey,
      model,
      messages,
      tools,
      tool_choice,
      parallel_tool_calls,
      response_format,
      signal: abortController.signal
    });
    return finalizeInstantTaskSuccess({ taskId, conversationId, response });
  } catch (error) {
    finalizeInstantTaskError({ taskId, error });
    throw error;
  } finally {
    runningInstantTaskControllers.delete(taskId);
  }
};

export const handleTaskCreateInstantApi = async (req, res, path) => {
  if (path !== '/api/task/create/instant' || req.method !== 'POST') return false;
  try {
    const {
      app,
      title = '',
      prompt,
      schema = null,
      meta = null,
      messages = null,
      tools = null,
      tool_choice = undefined,
      parallel_tool_calls = undefined,
      response_format = undefined
    } = await readBody(req);
    if (!String(app || '').trim()) return json(res, { success: false, message: 'app 不能为空' }, 400);
    if (!String(prompt || '').trim() && (!Array.isArray(messages) || messages.length === 0)) {
      return json(res, { success: false, message: 'prompt/messages 不能为空' }, 400);
    }
    const result = await createInstantTask({
      app: String(app || '').trim(),
      title: String(title || '').trim(),
      prompt: String(prompt || '').trim(),
      schema,
      meta,
      messages,
      tools,
      tool_choice,
      parallel_tool_calls,
      response_format
    });
    return json(res, result);
  } catch (e) {
    return json(res, { success: false, message: e?.message || '任务执行失败' }, 500);
  }
};
