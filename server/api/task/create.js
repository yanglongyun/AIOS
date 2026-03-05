import { randomUUID } from 'crypto';
import { db } from '../../db/client.js';
import { getSettings } from '../../db/settings.js';
import { chat } from '../../agent/handler.js';
import { broadcast } from '../../system/ws.js';
import { callLlmRegular } from '../../llm/regular.js';

const runningTaskControllers = new Map();

export const stopTaskExecution = (taskId) => {
  const controller = runningTaskControllers.get(taskId);
  if (!controller) return false;
  controller.abort();
  return true;
};

const parseJsonObject = (raw = '') => {
  const text = String(raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const matched = source.match(/\{[\s\S]*\}/);
  if (!matched) throw new Error('AI 返回不是 JSON');
  return JSON.parse(matched[0]);
};

const validateBySchema = (value, schema) => {
  if (!schema || typeof schema !== 'object') return true;
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (!(key in value)) {
      throw new Error(`结构化结果缺少字段: ${key}`);
    }
  }
  return true;
};

const runAgentTask = async ({
  app,
  prompt,
  provider,
  apiUrl,
  apiKey,
  model,
  send,
  signal,
  enableToolResultTruncate,
  toolResultMaxChars,
  enableToolLoopLimit,
  toolMaxRounds
}) => {
  const messages = [
    {
      role: 'system',
      content: [
        `你是 AIOS 的 agent，正在处理来自「${app}」应用的请求。直接返回结果，不要废话。`,
        `工具结果截断：${enableToolResultTruncate ? '开启' : '关闭'}；最大长度：${toolResultMaxChars}`,
        `工具循环限制：${enableToolLoopLimit ? '开启' : '关闭'}；最大轮次：${toolMaxRounds}`
      ].join('\n')
    },
    { role: 'user', content: prompt }
  ];

  return await chat(messages, {
    provider,
    apiUrl,
    apiKey,
    model,
    send,
    signal,
    maxRounds: enableToolLoopLimit ? toolMaxRounds : 100000,
    enableToolResultTruncate,
    toolResultMaxChars
  });
};

const runInstantTask = async ({
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

export const createTask = async ({
  app,
  title = '',
  mode = 'agent',
  prompt,
  schema = null,
  meta = null,
  messages = null,
  tools = null,
  tool_choice = undefined,
  parallel_tool_calls = undefined,
  response_format = undefined
}) => {
  const {
    apiUrl,
    apiKey,
    model,
    provider,
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  } = getSettings();
  const conversationId = `task:${randomUUID().slice(0, 8)}`;

  const row = db.prepare(
    "INSERT INTO tasks (conversation_id, app, title, mode, prompt, schema, meta, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending') RETURNING id"
  ).get(
    conversationId,
    app,
    String(title || ''),
    mode === 'instant' ? 'instant' : 'agent',
    prompt,
    schema ? JSON.stringify(schema) : null,
    meta ? JSON.stringify(meta) : null
  );
  broadcast({ type: 'tasks_changed' });

  const saveMessage = (msg, meta) => {
    db.prepare('INSERT INTO messages (conversation_id, message, meta) VALUES (?, ?, ?)').run(
      conversationId,
      JSON.stringify(msg),
      meta ? JSON.stringify(meta) : null
    );
  };

  const send = (msg) => {
    if (msg.type === 'tool_call') {
      if (msg.toolCall) {
        saveMessage({
          role: 'assistant',
          content: null,
          tool_calls: [msg.toolCall]
        }, null);
      }
      return;
    }

    if (msg.type === 'tool_result') {
      if (msg.message) saveMessage(msg.message, null);
      return;
    }

    if (msg.type === 'assistant') {
      if (msg.message) saveMessage(msg.message, null);
    }
  };

  const abortController = new AbortController();
  runningTaskControllers.set(row.id, abortController);

  try {
    const normalizedMode = mode === 'instant' ? 'instant' : 'agent';
    const result = normalizedMode === 'instant'
      ? await runInstantTask({
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
      })
      : await runAgentTask({
        app,
        prompt,
        provider,
        apiUrl,
        apiKey,
        model,
        send,
        signal: abortController.signal,
        enableToolResultTruncate,
        toolResultMaxChars,
        enableToolLoopLimit,
        toolMaxRounds
      });

    saveMessage({ role: 'assistant', content: result }, null);

    db.prepare(
      "UPDATE tasks SET response = ?, status = 'done', finished_at = datetime('now') WHERE id = ?"
    ).run(result, row.id);
    broadcast({ type: 'tasks_changed' });

    return { id: row.id, conversationId, response: result };
  } catch (e) {
    if (e?.name === 'AbortError') {
      db.prepare(
        "UPDATE tasks SET error = '用户终止任务', status = 'aborted', finished_at = datetime('now') WHERE id = ?"
      ).run(row.id);
    } else {
      db.prepare(
        "UPDATE tasks SET error = ?, status = 'error', finished_at = datetime('now') WHERE id = ?"
      ).run(e.message, row.id);
    }
    broadcast({ type: 'tasks_changed' });

    throw e;
  } finally {
    runningTaskControllers.delete(row.id);
  }
};
