import { chat } from '../agent/chat.js';
import { db } from '../db/client.js';
import { getSettings } from '../api/settings/get.js';
import { buildSystemPrompt } from '../agent/prompt.js';
import { getAppsCatalog } from './apps.js';

const getMessages = (chatId) => {
  const rows = db.prepare('SELECT message, meta FROM messages WHERE chat_id = ? ORDER BY id').all(chatId);
  return rows.map((r) => ({ ...JSON.parse(r.message), _meta: r.meta ? JSON.parse(r.meta) : null }));
};

const saveMessage = (chatId, msg, meta) => {
  db.prepare('INSERT INTO messages (chat_id, message, meta) VALUES (?, ?, ?)').run(
    chatId,
    JSON.stringify(msg),
    meta ? JSON.stringify(meta) : null
  );
};

export const createSession = (send) => {
  let chatId = null;
  let messages = [];
  let approvalResolve = null;

  const handleMessage = async (data) => {
    if (data.type === 'ping') {
      send({ type: 'pong' });
      return;
    }

    if (data.type === 'tool_approve') {
      if (approvalResolve) approvalResolve(true);
      return;
    }

    if (data.type === 'tool_reject') {
      if (approvalResolve) approvalResolve(false);
      return;
    }

    if (data.type === 'message') {
      const settings = getSettings();
      const { contextRounds, apiUrl, apiKey, model, enableFollowupSuggestions } = settings;
      const appsCatalog = getAppsCatalog();

      const incomingChatId = data.chatId || null;
      if (!incomingChatId) {
        send({ type: 'error', content: '缺少 chatId' });
        return;
      }

      if (incomingChatId !== chatId) {
        chatId = incomingChatId;
        messages = [{
          role: 'system',
          content: buildSystemPrompt(appsCatalog, { enableFollowupSuggestions })
        }, ...getMessages(chatId)];
      }

      messages[0] = {
        role: 'system',
        content: buildSystemPrompt(appsCatalog, { enableFollowupSuggestions })
      };

      const userMsg = { role: 'user', content: data.content };
      messages.push(userMsg);
      saveMessage(chatId, userMsg);

      const mode = data.mode || 'auto';
      const waitForApproval = () => new Promise((resolve) => { approvalResolve = resolve; });

      try {
        await chat(chatId, messages, send, {
          model,
          contextRounds,
          apiUrl,
          apiKey,
          mode,
          waitForApproval,
          saveMessage
        });
      } catch (e) {
        send({ type: 'error', content: e.message });
      }
    }
  };

  return { handleMessage };
};
