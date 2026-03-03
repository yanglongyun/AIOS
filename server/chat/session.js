import { chat } from '../agent/handler.js';
import { getSettings } from '../db/settings.js';
import { buildSystemPrompt } from './prompt.js';
import { getAppsCatalog } from './apps.js';
import { normalizeAttachments, buildAttachmentContext } from './attachments.js';
import { getMessages, saveMessage } from './messages.js';
import { getRecentChats } from './chats.js';

export const createSession = (wsSend) => {
  let sessionId = null;
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
      const appsCatalog = getAppsCatalog();

      const incomingSessionId = data.sessionId || data.chatId || null;
      if (!incomingSessionId) {
        wsSend({ type: 'error', content: '缺少 sessionId' });
        return;
      }

      if (incomingSessionId !== sessionId) {
        sessionId = incomingSessionId;
        const recentChats = getRecentChats();
        messages = [{
          role: 'system',
          content: buildSystemPrompt(appsCatalog, {
            modelInfo: { provider, model, apiUrl },
            chatContext: {
              currentSessionId: sessionId,
              recentChats
            },
            toolConfig: {
              enableToolResultTruncate,
              toolResultMaxChars,
              enableToolLoopLimit,
              toolMaxRounds
            }
          })
        }, ...getMessages(sessionId, contextRounds)];
      }

      const recentChats = getRecentChats();
      messages[0] = {
        role: 'system',
        content: buildSystemPrompt(appsCatalog, {
          chatContext: {
            currentSessionId: sessionId,
            recentChats
          },
          toolConfig: {
            enableToolResultTruncate,
            toolResultMaxChars,
            enableToolLoopLimit,
            toolMaxRounds
          }
        })
      };

      const userMsg = { role: 'user', content: data.content };
      messages.push(userMsg);
      const attachments = normalizeAttachments(data.attachments);
      saveMessage(sessionId, userMsg, attachments.length ? { attachments } : null);

      const modelMessages = [...messages];
      if (attachments.length) {
        const lastIndex = modelMessages.length - 1;
        const original = modelMessages[lastIndex];
        modelMessages[lastIndex] = {
          ...original,
          content: `${original.content}\n\n${buildAttachmentContext(attachments)}`
        };
      }

      abortController = new AbortController();
      const { signal } = abortController;

      const send = (msg) => {
        if (msg.type === 'tool_call') {
          if (msg.toolCall) {
            saveMessage(sessionId, {
              role: 'assistant',
              content: null,
              tool_calls: [msg.toolCall]
            }, null);
          }
          wsSend({ type: 'tool_call', toolCall: msg.toolCall });
          return;
        }

        if (msg.type === 'tool_result') {
          if (msg.message) saveMessage(sessionId, msg.message, null);
          wsSend({
            type: 'tool_result',
            toolCallId: msg.message?.tool_call_id,
            content: msg.message?.content ?? ''
          });
          return;
        }

        if (msg.type === 'assistant') {
          if (msg.message) saveMessage(sessionId, msg.message, null);
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
          content: buildSystemPrompt(appsCatalog, {
            modelInfo: { provider, model, apiUrl },
            toolConfig: {
              enableToolResultTruncate,
              toolResultMaxChars,
              enableToolLoopLimit,
              toolMaxRounds
            }
          })
        }, ...getMessages(sessionId, contextRounds)];
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
