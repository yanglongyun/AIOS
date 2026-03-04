import { chat } from '../agent/handler.js';
import { getSettings } from '../db/settings.js';
import { buildSystemPrompt } from './prompt.js';
import { injectAttachmentsMessage } from './attachments.js';
import { getMessages, saveMessage } from './messages.js';

export const createSession = (wsSend) => {
  let conversationId = null;
  let messages = [];
  let abortController = null;

  const handleMessage = async (data) => {
    if (data.type === 'ping') {
      wsSend({ type: 'pong' });
      return;
    }

    if (data.type === 'abort') {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      return;
    }

    if (data.type === 'message') {
      const settings = getSettings();
      const {
        contextRounds,
        apiUrl,
        apiKey,
        model,
        provider,
        enableToolResultTruncate,
        toolResultMaxChars,
        enableToolLoopLimit,
        toolMaxRounds
      } = settings;
      const incomingConversationId = data.conversationId || null;
      if (!incomingConversationId) {
        wsSend({ type: 'error', content: '缺少 conversationId' });
        return;
      }

      if (incomingConversationId !== conversationId) {
        conversationId = incomingConversationId;
        messages = [{
          role: 'system',
          content: buildSystemPrompt(conversationId)
        }, ...getMessages(conversationId, contextRounds)];
      }

      messages[0] = {
        role: 'system',
        content: buildSystemPrompt(conversationId)
      };

      const userMsg = { role: 'user', content: data.content };
      let userMeta = null;
      let modelUserMsg = userMsg;
      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        const injected = injectAttachmentsMessage([userMsg], data.attachments);
        modelUserMsg = injected.messages[0] || userMsg;
        if (injected.attachments.length > 0) {
          userMeta = { attachments: injected.attachments };
        }
      }

      messages.push(userMsg);
      const modelMessages = [...messages];
      modelMessages[modelMessages.length - 1] = modelUserMsg;
      saveMessage(conversationId, userMsg, userMeta);

      abortController = new AbortController();
      const { signal } = abortController;

      const send = (msg) => {
        if (msg.type === 'tool_call') {
          if (msg.toolCall) {
            saveMessage(conversationId, {
              role: 'assistant',
              content: null,
              tool_calls: [msg.toolCall]
            }, null);
          }
          wsSend({ type: 'tool_call', toolCall: msg.toolCall });
          return;
        }

        if (msg.type === 'tool_result') {
          if (msg.message) saveMessage(conversationId, msg.message, null);
          wsSend({
            type: 'tool_result',
            toolCallId: msg.message?.tool_call_id,
            content: msg.message?.content ?? ''
          });
          return;
        }

        if (msg.type === 'assistant') {
          if (msg.message) saveMessage(conversationId, msg.message, null);
          wsSend({ type: 'assistant', content: msg.message?.content ?? '' });
          return;
        }
      };

      try {
        await chat(modelMessages, {
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
        messages = [{
          role: 'system',
          content: buildSystemPrompt(conversationId)
        }, ...getMessages(conversationId, contextRounds)];
      } catch (e) {
        if (e.name === 'AbortError') {
          wsSend({ type: 'aborted' });
        } else {
          wsSend({ type: 'error', content: e.message });
        }
      } finally {
        abortController = null;
      }
    }
  };

  return { handleMessage };
};
