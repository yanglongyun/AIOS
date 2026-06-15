import { on } from '@/system/ws.js';
import { mapToolCall, mkKey } from './messages.js';

export function setupChatStream({ messages, currentChatId, busy, streamingKey, seenKeys, scrollToBottom }) {
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
    on('input', (data) => {
      if (!isCurrent(data)) return;
      const msg = data.message || {};
      const _key = `input:${data.id || Date.now()}`;
      if (!seenKeys.value.has(_key)) {
        seenKeys.value.add(_key);
        const source = data.meta?.source || '';
        const kind = data.kind || data.meta?.kind || (source === 'subscription' ? 'task' : 'message');
        messages.value.push({
          role: kind === 'compaction' ? 'compaction' : (kind === 'task' ? 'task' : 'user'),
          content: msg.content || '',
          attachments: data.meta?.attachments || [],
          source,
          kind,
          _key
        });
        scrollToBottom?.(true);
      }
    }),

    on('start', (data) => {
      if (!isCurrent(data)) return;
      busy.value = true;
    }),

    on('compact_start', (data) => {
      if (!isCurrent(data)) return;
      busy.value = true;
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
        for (let i = messages.value.length - 1; i >= 0; i--) {
          const msg = messages.value[i];
          if (msg.type === 'tool_call' && !msg.result) {
            msg.result = result.content;
            break;
          }
        }
      }
      scrollToBottom?.(true);
    }),

    on('error', (data) => {
      if (data.chatId && !isCurrent(data)) return;
      closeStreaming();
      const content = data.code === 'model_settings_missing'
        ? `__T_CHAT_ERROR_MISSING_SETTINGS__`
        : `${'__T_CHAT_ERROR_PREFIX__'}: ${data.content || ''}`;
      messages.value.push({ role: 'assistant', content, _key: mkKey('error') });
      busy.value = false;
      scrollToBottom?.(true);
    }),

    on('aborted', (data) => {
      if (!isCurrent(data)) return;
      closeStreaming();
      busy.value = false;
    })
  ];
}
