import { randomUUID } from 'crypto';
import { db } from '../../db/client.js';
import { getSettings } from '../../db/settings.js';
import { chat } from '../../agent/handler.js';
import { broadcast } from '../../system/ws.js';

const runningTaskControllers = new Map();

export const stopTaskExecution = (taskId) => {
  const controller = runningTaskControllers.get(taskId);
  if (!controller) return false;
  controller.abort();
  return true;
};

export const createTask = async ({ app, prompt }) => {
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
  const sessionId = `task:${randomUUID().slice(0, 8)}`;

  const row = db.prepare(
    "INSERT INTO tasks (session_id, app, prompt, status) VALUES (?, ?, ?, 'pending') RETURNING id"
  ).get(sessionId, app, prompt);
  broadcast({ type: 'tasks_changed' });

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

  const saveMessage = (msg, meta) => {
    db.prepare('INSERT INTO messages (session_id, message, meta) VALUES (?, ?, ?)').run(
      sessionId,
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
    const result = await chat(messages, {
      provider,
      apiUrl,
      apiKey,
      model,
      send,
      signal: abortController.signal,
      maxRounds: enableToolLoopLimit ? toolMaxRounds : 100000,
      enableToolResultTruncate,
      toolResultMaxChars
    });

    db.prepare(
      "UPDATE tasks SET response = ?, status = 'done', finished_at = datetime('now') WHERE id = ?"
    ).run(result, row.id);
    broadcast({ type: 'tasks_changed' });

    return { id: row.id, sessionId, response: result };
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
