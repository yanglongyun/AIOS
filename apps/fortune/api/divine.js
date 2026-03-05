import { db } from '../db.js';
import { callLlmChat } from '../../app_shared/chatLlm.js';

const parseModelJson = (raw = '') => {
  const text = String(raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const matched = source.match(/\{[\s\S]*\}/);
  if (!matched) throw new Error('AI 返回不是 JSON');
  return JSON.parse(matched[0]);
};

export const divineHandler = async (body = {}, req) => {
  const question = String(body.question || '').trim();
  if (!question) return { status: 400, message: '请输入你的问题' };

  const hexagram = String(body.hexagram || '').trim();
  const yaos = String(body.yaos || '').trim();

  try {
    const llm = await callLlmChat(req, {
      response_format: { type: 'json_object' },
      messages: [{
        role: 'system',
        content: `你是一位精通周易六爻的卦师，学识渊博、文笔古雅。
用户通过摇铜钱起卦，已经得到了具体的卦象。请基于此卦象为用户解卦。

要求：
1. signName：给出卦象评价（如"大吉"、"中吉"、"小吉"、"中平"、"小凶"、"大凶"）
2. signPoem：写一首原创四句七言签诗，有古韵，切合卦象与问题
3. good：宜做之事（2-3项，逗号分隔）
4. bad：忌做之事（2-3项，逗号分隔）
5. advice：结合卦象和问题给出解读建议（80-120字，有易经味道但通俗实用）

注意：解读必须紧扣所得卦象"${hexagram}"的卦义，不可随意发挥。

必须返回 JSON：
{"signName":"评价","signPoem":"签诗","good":"宜","bad":"忌","advice":"建议"}`
      }, {
        role: 'user',
        content: `我的问题：${question}\n所得卦象：${hexagram}\n爻象（初爻到上爻）：${yaos}`
      }]
    });
    if (!llm.ok) return { status: llm.status, message: llm.message || '卦象解读失败' };
    const data = llm.data;

    const parsed = parseModelJson(data.message?.content || '');
    const record = {
      question,
      signName: String(parsed.signName || '').trim() || '未知',
      signPoem: String(parsed.signPoem || '').trim() || '',
      good: String(parsed.good || '').trim() || '',
      bad: String(parsed.bad || '').trim() || '',
      advice: String(parsed.advice || '').trim() || '',
      hexagram
    };

    const ret = db.prepare(`
      INSERT INTO apps_fortune_records (question, sign_name, sign_poem, good, bad, advice, hexagram)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(record.question, record.signName, record.signPoem, record.good, record.bad, record.advice, record.hexagram);

    const item = db.prepare(`
      SELECT id, question, sign_name AS signName, sign_poem AS signPoem, good, bad, advice, hexagram, created_at AS createdAt
      FROM apps_fortune_records WHERE id = ?
    `).get(ret.lastInsertRowid);

    return { success: true, item };
  } catch (e) {
    return { status: 500, message: e.message || '占卜失败' };
  }
};
