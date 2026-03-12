import { randomUUID } from 'crypto';
import { callLlmRegular } from '../../../system/llm/regular.js';
import { getSettings } from '../../settings/get.js';
import { registerTaskExecution, unregisterTaskExecution } from '../execution.js';
import {
  insertInstantTaskRecord,
  saveTaskMessage,
  updateTaskAborted,
  updateTaskDone,
  updateTaskError
} from '../../../repository/task/create.js';
import { broadcast } from '../../../system/ws.js';
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
      response_format,
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
