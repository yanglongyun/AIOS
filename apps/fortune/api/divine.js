import { db } from '../db.js';

const parseModelJson = (raw = '') => {
  const text = String(raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const matched = source.match(/\{[\s\S]*\}/);
  if (!matched) throw new Error('AI 返回不是 JSON');
  return JSON.parse(matched[0]);
};

export const divineHandler = async (body = {}) => {
  const question = String(body.question || '').trim();
  if (!question) return { status: 400, message: '请输入你的问题' };

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [{
          role: 'system',
          content: `你是一位古风算卦大师，精通易经八卦、诗词歌赋。用户提出问题后，你需要：
1. 给出一个签名（如"上上签"、"中吉签"、"下下签"等）
2. 写一句四言或七言签诗（原创，有古韵）
3. 给出"宜"（2-3项，简短）
4. 给出"忌"（2-3项，简短）
5. 给出一段解签建议（50-100字，有玄学味但实用）

必须返回 JSON：
{"signName":"签名","signPoem":"签诗","good":"宜做的事，逗号分隔","bad":"忌做的事，逗号分隔","advice":"解签建议"}`
        }, {
          role: 'user',
          content: question
        }]
      })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || '卦象解读失败' };
    }

    const parsed = parseModelJson(data.message?.content || '');
    const record = {
      question,
      signName: String(parsed.signName || '').trim() || '未知签',
      signPoem: String(parsed.signPoem || '').trim() || '',
      good: String(parsed.good || '').trim() || '',
      bad: String(parsed.bad || '').trim() || '',
      advice: String(parsed.advice || '').trim() || ''
    };

    const ret = db.prepare(`
      INSERT INTO apps_fortune_records (question, sign_name, sign_poem, good, bad, advice)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(record.question, record.signName, record.signPoem, record.good, record.bad, record.advice);

    const item = db.prepare(`
      SELECT id, question, sign_name AS signName, sign_poem AS signPoem, good, bad, advice, created_at AS createdAt
      FROM apps_fortune_records WHERE id = ?
    `).get(ret.lastInsertRowid);

    return { success: true, item };
  } catch (e) {
    return { status: 500, message: e.message || '占卜失败' };
  }
};
