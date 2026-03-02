import { db } from '../../app_shared/db/client.js';

export const startHandler = async (body = {}) => {
  const debateId = String(body.debateId || '').trim();
  const candidateName = String(body.candidateName || '').trim();
  const candidateParty = String(body.candidateParty || '').trim();
  const opponentName = String(body.opponentName || '').trim();
  const opponentParty = String(body.opponentParty || '').trim();

  if (!debateId || !candidateName || !candidateParty || !opponentName || !opponentParty) {
    return { status: 400, message: '参数不完整' };
  }

  db.prepare(`
    INSERT OR REPLACE INTO apps_debate_sessions (
      debate_id, candidate_name, candidate_party, opponent_name, opponent_party
    ) VALUES (?, ?, ?, ?, ?)
  `).run(debateId, candidateName, candidateParty, opponentName, opponentParty);

  const messages = [{
    role: 'user',
    content: `现在参与美国总统电视辩论的双方人选是：
来自${candidateParty}的${candidateName}，
以及来自${opponentParty}的${opponentName}。
请生成本次辩论议题和主持人开场白。
要求：
1) 议题可考虑 经济、乌克兰、中国、巴以冲突、堕胎权、移民、国家安全、医疗等
2) 议题数量不超过 5 个
3) 开场白必须非常简短
4) 只返回 JSON，格式：
{"topics":["议题1","议题2"],"prologue":"开场白"}`
  }];

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || `LLM request failed: ${res.status}` };
    }

    const raw = String(data.message?.content || '').trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const parsed = JSON.parse(fenced ? fenced[1].trim() : raw);

    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5).map((t) => String(t || '').trim()).filter(Boolean) : [],
      prologue: String(parsed.prologue || '').trim()
    };
  } catch (error) {
    return { status: 500, message: error.message || '开始辩论失败' };
  }
};
