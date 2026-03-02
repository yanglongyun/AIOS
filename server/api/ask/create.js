import { randomUUID } from 'crypto';
import { db } from '../../db/client.js';
import { getSettings } from '../../db/settings.js';
import { chat } from '../../agent/handler.js';
import { broadcast } from '../../system/ws.js';

export const createAsk = async ({ app, prompt }) => {
  const { apiUrl, apiKey, model, provider } = getSettings();
  const sessionId = `ask:${randomUUID().slice(0, 8)}`;

  const row = db.prepare(
    "INSERT INTO asks (session_id, app, prompt, status) VALUES (?, ?, ?, 'pending') RETURNING id"
  ).get(sessionId, app, prompt);
  broadcast({ type: 'asks_changed' });

  const messages = [
    { role: 'system', content: `你是 AIOS 的 agent，正在处理来自「${app}」应用的请求。直接返回结果，不要废话。` },
    { role: 'user', content: prompt }
  ];

  const saveMessage = (msg, meta) => {
    db.prepare('INSERT INTO messages (session_id, message, meta) VALUES (?, ?, ?)').run(
      sessionId,
      JSON.stringify(msg),
      meta ? JSON.stringify(meta) : null
    );
  };

  const send = (msg) => {
    if (msg._message) saveMessage(msg._message, msg._meta);
  };

  try {
    const result = await chat(messages, {
      model, apiUrl, apiKey, provider,
      maxRounds: 10,
      send
    });

    db.prepare(
      "UPDATE asks SET response = ?, status = 'done', finished_at = datetime('now') WHERE id = ?"
    ).run(result, row.id);
    broadcast({ type: 'asks_changed' });

    return { id: row.id, sessionId, response: result };
  } catch (e) {
    db.prepare(
      "UPDATE asks SET error = ?, status = 'error', finished_at = datetime('now') WHERE id = ?"
    ).run(e.message, row.id);
    broadcast({ type: 'asks_changed' });

    throw e;
  }
};
