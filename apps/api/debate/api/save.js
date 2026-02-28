import { db } from '../../../db/client.js';

export const saveHandler = (body = {}) => {
  const debateId = String(body.debateId || '').trim();
  const topicName = String(body.topicName || '').trim();
  const speakerRole = String(body.speakerRole || '').trim();
  const speakerName = String(body.speakerName || '').trim();
  const content = String(body.content || '');
  const draft = String(body.draft || '');

  if (!debateId || !topicName || !speakerRole || !speakerName) {
    return { status: 400, message: '参数不完整' };
  }

  const r = db.prepare(`
    INSERT INTO apps_debate_records (debate_id, topic_name, speaker_role, speaker_name, content, draft)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(debateId, topicName, speakerRole, speakerName, content, draft);

  return { success: true, id: r.lastInsertRowid };
};
