import { on } from './ws.js';
import { fillToolCallResult, mapToolCall, mkKey } from './messages.js';

export function setupChatStream({ messages, currentChatId, busy, compacting, streamingKey, seenKeys, scrollToBottom }) {
  const isCurrent = (data) => data.chatId === currentChatId.value;

  const closeStreaming = (finalText) => {
    const key = streamingKey.value;
    streamingKey.value = '';
    if (!key) return;
    const msg = messages.value.find((item) => item._key === key);
    if (!msg || msg.role !== 'assistant') return;
    if (finalText) msg.content = String(finalText);
    if (!msg.content) {
      messages.value = messages.value.filter((item) => item._key !== key);
    }
  };

  return [
    on('start', (data) => {
      if (!isCurrent(data)) return;
      busy.value = true;
      if (compacting) compacting.value = false;
    }),

    on('compact_start', (data) => {
      if (!isCurrent(data)) return;
      if (compacting) compacting.value = true;
    }),

    on('compact_done', (data) => {
      if (!isCurrent(data)) return;
      if (compacting) compacting.value = false;
    }),

    on('input', (data) => {
      if (!isCurrent(data)) return;
      const msg = data.message || {};
      const kind = data.kind || data.meta?.kind || 'message';
      const _key = `input:${kind}:${data.id || Date.now()}`;
      if (seenKeys.value.has(_key)) return;
      seenKeys.value.add(_key);
      const role = kind === 'task' ? 'task' : (kind === 'compaction' ? 'compaction' : 'user');
      messages.value.push({
        role,
        kind,
        content: msg.content || '',
        attachments: data.meta?.attachments || [],
        meta: data.meta || null,
        expanded: false,
        _key
      });
      scrollToBottom?.(true);
    }),

    on('message', (data) => {
      if (!isCurrent(data)) return;
      busy.value = true;
      if (!data.content) return;
      let key = streamingKey.value;
      if (!key) {
        key = mkKey('assistant');
        streamingKey.value = key;
        seenKeys.value.add(key);
        messages.value.push({ role: 'assistant', content: '', _key: key });
      }
      const msg = messages.value.find((item) => item._key === key);
      if (msg) msg.content = (msg.content || '') + data.content;
      scrollToBottom?.(true);
    }),

    on('done', (data) => {
      if (!isCurrent(data)) return;
      closeStreaming();
      if (compacting) compacting.value = false;
      busy.value = false;
      scrollToBottom?.(true);
    }),

    on('tool_calls', (data) => {
      if (!isCurrent(data)) return;
      closeStreaming();
      for (const toolCall of data.toolCalls || []) {
        const _key = mkKey('tool_call');
        seenKeys.value.add(_key);
        messages.value.push(mapToolCall(toolCall, _key));
      }
      scrollToBottom?.(true);
    }),

    on('tool_results', (data) => {
      if (!isCurrent(data)) return;
      for (const result of data.results || []) {
        fillToolCallResult(messages.value, result);
      }
      scrollToBottom?.(true);
    }),

    on('error', (data) => {
      if (data.chatId && !isCurrent(data)) return;
      closeStreaming();
      messages.value.push({ role: 'assistant', content: `错误: ${data.content || ''}`, _key: mkKey('error') });
      if (compacting) compacting.value = false;
      busy.value = false;
      scrollToBottom?.(true);
    }),

    on('aborted', (data) => {
      if (!isCurrent(data)) return;
      closeStreaming();
      if (compacting) compacting.value = false;
      busy.value = false;
    })
  ];
}
