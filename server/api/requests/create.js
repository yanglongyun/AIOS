import { db } from '../../db/client.js';
import { getSettings } from '../../db/settings.js';
import { chat } from '../../agent/handler.js';

export const createRequest = async ({ app, prompt }) => {
  const { apiUrl, apiKey, model, provider } = getSettings();

  const row = db.prepare(
    "INSERT INTO requests (app, prompt, status) VALUES (?, ?, 'pending') RETURNING id"
  ).get(app, prompt);

  const messages = [
    { role: 'system', content: `你是 AIOS 的 agent，正在处理来自「${app}」应用的请求。直接返回结果，不要废话。` },
    { role: 'user', content: prompt }
  ];

  try {
    const result = await chat(messages, {
      model, apiUrl, apiKey, provider,
      maxRounds: 10
    });

    db.prepare(
      "UPDATE requests SET response = ?, status = 'done', finished_at = datetime('now') WHERE id = ?"
    ).run(result, row.id);

    return { id: row.id, response: result };
  } catch (e) {
    db.prepare(
      "UPDATE requests SET error = ?, status = 'error', finished_at = datetime('now') WHERE id = ?"
    ).run(e.message, row.id);

    throw e;
  }
};
