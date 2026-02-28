import { db } from '../../../db/client.js';

export const finishHandler = async (body = {}) => {
  const debateId = String(body.debateId || '').trim();
  const candidateParty = String(body.candidateParty || '').trim();
  const candidateName = String(body.candidateName || '').trim();
  const supportRate = Number(body.supportRate || 0);
  const policy = String(body.policy || '').trim();
  const candidateSupportRate = Number(body.candidateSupportRate || 0);
  const opponentSupportRate = Number(body.opponentSupportRate || 0);
  const endTime = String(body.endTime || new Date().toISOString());

  if (!debateId || !candidateName || !candidateParty) {
    return { status: 400, message: '参数不完整' };
  }

  db.prepare(`
    UPDATE apps_debate_sessions
    SET candidate_support_rate = ?, opponent_support_rate = ?, end_time = ?
    WHERE debate_id = ?
  `).run(candidateSupportRate, opponentSupportRate, endTime, debateId);

  const messages = [{ role: 'system', content: '你扮演美国总统辩论主持人。' }];
  if (supportRate > 50) {
    const party = db.prepare('SELECT * FROM apps_debate_parties WHERE name = ?').get(candidateParty);
    if (party) {
      db.prepare('UPDATE apps_debate_parties SET win_count = ? WHERE name = ?')
        .run(Number(party.win_count || 0) + 1, candidateParty);
    }
    messages.push({
      role: 'user',
      content: `当前候选人：${candidateName}
候选人政策主张：${policy}
候选人竞选成功，请基于其主张生成一份总统就职演讲。`
    });
  } else {
    messages.push({
      role: 'user',
      content: `当前候选人：${candidateName}
候选人政策主张：${policy}
候选人落败，请结合以上情况分析失败原因。`
    });
  }

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || `LLM request failed: ${res.status}` };
    }
    return { content: String(data.message?.content || '').trim() };
  } catch (error) {
    return { status: 500, message: error.message || '结束辩论失败' };
  }
};
