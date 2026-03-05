import { db } from '../db.js';

export const latestHandler = () => {
  const session = db.prepare(`
    SELECT
      debate_id AS debateId,
      candidate_name AS candidateName,
      candidate_party AS candidateParty,
      opponent_name AS opponentName,
      opponent_party AS opponentParty,
      candidate_support_rate AS candidateSupportRate,
      opponent_support_rate AS opponentSupportRate,
      start_time AS startTime,
      end_time AS endTime,
      created_at AS createdAt
    FROM apps_debate_sessions
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 1
  `).get();

  if (!session) return { success: true, session: null, topics: [], currentTopic: 1 };

  const candidateParty = db.prepare(`
    SELECT support_rate AS supportRate
    FROM apps_debate_parties
    WHERE name = ?
    LIMIT 1
  `).get(session.candidateParty);

  const opponentParty = db.prepare(`
    SELECT support_rate AS supportRate
    FROM apps_debate_parties
    WHERE name = ?
    LIMIT 1
  `).get(session.opponentParty);

  const records = db.prepare(`
    SELECT topic_name AS topicName, speaker_role AS speakerRole, speaker_name AS speakerName, content
    FROM apps_debate_records
    WHERE debate_id = ?
    ORDER BY id ASC
  `).all(session.debateId);

  const topicMap = new Map();
  const topics = [];
  for (const rec of records) {
    const key = String(rec.topicName || '').trim() || '未命名议题';
    if (!topicMap.has(key)) {
      const topic = {
        topicName: key,
        messages: [],
        status: true,
        candidateSupportRate: Number(candidateParty?.supportRate || 0),
        opponentSupportRate: Number(opponentParty?.supportRate || 0),
        candidatePolicy: ''
      };
      topicMap.set(key, topic);
      topics.push(topic);
    }
    topicMap.get(key).messages.push({
      role: rec.speakerRole,
      name: rec.speakerName,
      content: rec.content || ''
    });
  }

  const currentTopic = Math.max(1, topics.length || 1);
  return {
    success: true,
    session,
    topics,
    currentTopic,
    sessionEnded: Boolean(session.endTime)
  };
};
