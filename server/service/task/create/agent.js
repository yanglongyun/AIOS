import { randomUUID } from 'crypto';
import { chat } from '../../../agent/handler.js';
import { getSettings } from '../../settings/get.js';
import { registerTaskExecution, unregisterTaskExecution } from '../execution.js';
import {
  insertAgentTaskRecord,
  saveTaskMessage,
  updateTaskAborted,
  updateTaskDone,
  updateTaskError
} from '../../../repository/task/create.js';
import { broadcast } from '../../../system/ws.js';

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

export const createAgentTask = async ({
  app,
  title = '',
  prompt,
  meta = null,
  schedule_id = null
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
  const { taskId } = insertAgentTaskRecord({
    conversationId,
    app,
    title,
    prompt,
    meta,
    schedule_id
  });
  broadcast({ type: 'tasks_changed' });

  const send = (msg) => {
    if (msg.type === 'tool_call') {
      if (msg.toolCall) {
        saveTaskMessage(conversationId, {
          role: 'assistant',
          content: null,
          tool_calls: [msg.toolCall]
        }, null);
      }
      return;
    }
    if (msg.type === 'tool_result') {
      if (msg.message) saveTaskMessage(conversationId, msg.message, null);
      return;
    }
    if (msg.type === 'assistant') {
      if (msg.message) saveTaskMessage(conversationId, msg.message, null);
    }
  };

  const abortController = new AbortController();
  registerTaskExecution(taskId, abortController);

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
    saveTaskMessage(conversationId, { role: 'assistant', content: response }, null);
    updateTaskDone({ taskId, response });
    broadcast({ type: 'tasks_changed' });
    return { id: taskId, conversationId, response };
  } catch (error) {
    if (error?.name === 'AbortError') {
      updateTaskAborted({ taskId });
    } else {
      updateTaskError({ taskId, message: error?.message || '任务执行失败' });
    }
    broadcast({ type: 'tasks_changed' });
    throw error;
  } finally {
    unregisterTaskExecution(taskId);
  }
};

