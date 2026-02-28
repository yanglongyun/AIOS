import { chat } from '../agent/chat.js';
import { db } from '../db/client.js';
import { getSettings } from '../api/settings/get.js';
import { buildSystemPrompt } from '../agent/prompt.js';
import { getAppsCatalog } from './apps.js';
import { resolve } from 'path';

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

const getRecentChats = () => {
  return db.prepare(`
    SELECT id, title, description
    FROM chats
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 3
  `).all().map((row) => ({
    id: row.id,
    title: String(row.title || '').trim(),
    description: String(row.description || '').trim().slice(0, 100)
  }));
};

const normalizeAttachments = (raw) => {
  const baseDir = resolve(process.cwd(), 'uploads', 'chat');
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      name: String(item?.name || '').trim(),
      path: String(item?.path || '').trim(),
      size: Number(item?.size || 0)
    }))
    .filter((item) => {
      if (!item.name || !item.path) return false;
      const abs = resolve(item.path);
      return abs.startsWith(baseDir);
    })
    .slice(0, 10);
};

const buildAttachmentContext = (attachments = []) => {
  if (!attachments.length) return '';
  const lines = [
    '【附件文件路径】',
    ...attachments.map((f, i) => `${i + 1}. ${f.name}: ${f.path}`),
    '请先用 shell 读取这些文件内容，再结合用户问题回答。'
  ];
  return lines.join('\n');
};

export const createSession = (send) => {
  let chatId = null;
  let messages = [];
  let approvalResolve = null;
  let abortController = null;

  const handleMessage = async (data) => {
    if (data.type === 'ping') {
      send({ type: 'pong' });
      return;
    }

    if (data.type === 'abort') {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
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
        const recentChats = getRecentChats();
        messages = [{
          role: 'system',
          content: buildSystemPrompt(appsCatalog, {
            enableFollowupSuggestions,
            chatContext: {
              currentChatId: chatId,
              recentChats
            }
          })
        }, ...getMessages(chatId)];
      }

      const recentChats = getRecentChats();
      messages[0] = {
        role: 'system',
        content: buildSystemPrompt(appsCatalog, {
          enableFollowupSuggestions,
          chatContext: {
            currentChatId: chatId,
            recentChats
          }
        })
      };

      const userMsg = { role: 'user', content: data.content };
      messages.push(userMsg);
      const attachments = normalizeAttachments(data.attachments);
      saveMessage(chatId, userMsg, attachments.length ? { attachments } : null);

      const modelMessages = [...messages];
      if (attachments.length) {
        const lastIndex = modelMessages.length - 1;
        const original = modelMessages[lastIndex];
        modelMessages[lastIndex] = {
          ...original,
          content: `${original.content}\n\n${buildAttachmentContext(attachments)}`
        };
      }

      const mode = data.mode || 'auto';
      const waitForApproval = () => new Promise((resolve) => { approvalResolve = resolve; });

      abortController = new AbortController();
      const { signal } = abortController;

      try {
        await chat(chatId, modelMessages, send, {
          model,
          contextRounds,
          apiUrl,
          apiKey,
          mode,
          waitForApproval,
          saveMessage,
          signal
        });
        messages = [{
          role: 'system',
          content: buildSystemPrompt(appsCatalog, { enableFollowupSuggestions })
        }, ...getMessages(chatId)];
      } catch (e) {
        if (e.name === 'AbortError') {
          send({ type: 'aborted' });
        } else {
          send({ type: 'error', content: e.message });
        }
      } finally {
        abortController = null;
      }
    }
  };

  return { handleMessage };
};
