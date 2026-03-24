import type { AnyRecord } from '../../../shared/types.ts';
import { randomUUID } from 'crypto';
import { callLlmRegular } from '../../llm/regular.ts';
import { buildSystemPrompt } from '../../prompt/index.ts';
import { getSettings } from '../../service/settings/get.ts';
import { registerTaskExecution, unregisterTaskExecution } from '../execution.ts';
import {
  insertInstantTaskRecord,
  saveTaskMessage,
  updateTaskAborted,
  updateTaskDone,
  updateTaskError
} from '../../repository/task/create.ts';
import { broadcast } from '../../system/ws.ts';
import { parseJsonObject, validateBySchema } from '../../../shared/ai/json.ts';

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
  signal
}: AnyRecord) => {
  const hasMessages = Array.isArray(messages) && messages.length > 0;
  const systemPrompt = buildSystemPrompt();
  const payload: AnyRecord = {
    model,
    messages: hasMessages ? messages : [
      {
        role: 'system',
        content: systemPrompt
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

  const assistant = await callLlmRegular(provider, apiUrl, apiKey, payload, signal);
  const content = String(assistant?.content || '').trim();

  if (Array.isArray(assistant?.tool_calls) && assistant.tool_calls.length > 0) {
    return JSON.stringify({
      content,
      tool_calls: assistant.tool_calls
    });
  }

  if (schema) {
    const parsed = parseJsonObject(content);
    validateBySchema(parsed, schema);
    return JSON.stringify(parsed);
  }

  return content;
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
}: AnyRecord) => {
  const { apiUrl, apiKey, model, provider } = getSettings();
  const conversationId = `task:${randomUUID().slice(0, 8)}`;
  const { taskId } = insertInstantTaskRecord({
    conversationId,
    app,
    title,
    prompt,
    schema,
    meta
  });
  broadcast({ type: 'tasks_changed' });

  const abortController = new AbortController();
  registerTaskExecution(taskId, abortController);

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
      signal: abortController.signal
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
