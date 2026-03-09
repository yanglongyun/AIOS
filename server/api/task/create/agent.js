import { chat } from '../../../agent/handler.js';
import { randomUUID } from 'crypto';
import { db } from '../../../db/client.js';
import { getSettings } from '../../../service/settings/get.js';
import { broadcast } from '../../../system/ws.js';
import { readBody } from '../../../../shared/http/readBody.js';
import { json } from '../../../../shared/http/json.js';

export const runAgentTask = async ({
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

const runningAgentTaskControllers = new Map();

export const stopAgentTaskExecution = (taskId) => {
  const controller = runningAgentTaskControllers.get(taskId);
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

const createAgentTaskRecord = ({
  app,
  title,
  prompt,
  meta = null
}) => {
  const conversationId = `task:${randomUUID().slice(0, 8)}`;
  const row = db.prepare(
    "INSERT INTO tasks (conversation_id, app, title, mode, prompt, schema, meta, status) VALUES (?, ?, ?, 'agent', ?, NULL, ?, 'pending') RETURNING id"
  ).get(
    conversationId,
    app,
    String(title || ''),
    prompt,
    meta ? JSON.stringify(meta) : null
  );
  broadcast({ type: 'tasks_changed' });
  return { conversationId, taskId: row.id };
};

const finalizeAgentTaskSuccess = ({ taskId, conversationId, response }) => {
  saveMessage(conversationId, { role: 'assistant', content: response }, null);
  db.prepare(
    "UPDATE tasks SET response = ?, status = 'done', finished_at = datetime('now') WHERE id = ?"
  ).run(response, taskId);
  broadcast({ type: 'tasks_changed' });
  return { id: taskId, conversationId, response };
};

const finalizeAgentTaskError = ({ taskId, error }) => {
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

export const createAgentTask = async ({
  app,
  title = '',
  prompt,
  meta = null
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

  const { conversationId, taskId } = createAgentTaskRecord({
    app,
    title,
    prompt,
    meta
  });

  const send = (msg) => {
    if (msg.type === 'tool_call') {
      if (msg.toolCall) {
        saveMessage(conversationId, {
          role: 'assistant',
          content: null,
          tool_calls: [msg.toolCall]
        }, null);
      }
      return;
    }
    if (msg.type === 'tool_result') {
      if (msg.message) saveMessage(conversationId, msg.message, null);
      return;
    }
    if (msg.type === 'assistant') {
      if (msg.message) saveMessage(conversationId, msg.message, null);
    }
  };

  const abortController = new AbortController();
  runningAgentTaskControllers.set(taskId, abortController);

  try {
    const response = await runAgentTask({
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
    return finalizeAgentTaskSuccess({ taskId, conversationId, response });
  } catch (error) {
    finalizeAgentTaskError({ taskId, error });
    throw error;
  } finally {
    runningAgentTaskControllers.delete(taskId);
  }
};

export const handleTaskCreateAgentApi = async (req, res, path) => {
  if (path !== '/api/task/create/agent' || req.method !== 'POST') return false;
  try {
    const { app, title = '', prompt, meta = null } = await readBody(req);
    if (!String(app || '').trim()) return json(res, { success: false, message: 'app 不能为空' }, 400);
    if (!String(prompt || '').trim()) return json(res, { success: false, message: 'prompt 不能为空' }, 400);
    const result = await createAgentTask({
      app: String(app || '').trim(),
      title: String(title || '').trim(),
      prompt: String(prompt || '').trim(),
      meta
    });
    return json(res, result);
  } catch (e) {
    return json(res, { success: false, message: e?.message || '任务执行失败' }, 500);
  }
};
