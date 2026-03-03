import { chat } from '../agent/handler.js';
import { db } from '../db/client.js';
import { getSettings } from '../db/settings.js';
import { buildSystemPrompt } from './prompt.js';
import { getAppsCatalog } from './apps.js';
import { resolve } from 'path';

const getMessages = (sessionId, messageLimit = 30) => {
  const limit = Math.max(1, Math.min(500, Number(messageLimit) || 30));
  const rows = db.prepare('SELECT message, meta FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?').all(sessionId, limit);
  return rows.reverse().map((r) => ({ ...JSON.parse(r.message), _meta: r.meta ? JSON.parse(r.meta) : null }));
};

const saveMessage = (sessionId, msg, meta) => {
  db.prepare('INSERT INTO messages (session_id, message, meta) VALUES (?, ?, ?)').run(
    sessionId,
    JSON.stringify(msg),
    meta ? JSON.stringify(meta) : null
  );
};

const getRecentChats = () => {
  return db.prepare(`
    SELECT session_id, title, description
    FROM chats
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 3
  `).all().map((row) => ({
    sessionId: row.session_id,
    title: String(row.title || '').trim(),
    description: String(row.description || '').trim().slice(0, 100)
  }));
};

const normalizeAttachments = (raw) => {
  const baseDir = resolve(process.cwd(), 'files', 'uploads', 'chat');
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
        if (msg._message) saveMessage(sessionId, msg._message, msg._meta);
        if (msg.type !== 'assistant') wsSend(msg);
      };

      try {
        await chat(modelMessages, {
          model,
          maxRounds: enableToolLoopLimit ? toolMaxRounds : 100000,
          contextRounds,
          apiUrl,
          apiKey,
          provider,
          enableToolResultTruncate,
          toolResultMaxChars,
          send,
          signal
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
