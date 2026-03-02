import { db } from '../../app_shared/db/client.js';

const parseModelJson = (raw = '') => {
  const text = String(raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse((fenced ? fenced[1] : text).trim());
};

const toDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getFallbackQuestion = (answeredCount) => {
  if (answeredCount <= 0) {
    return {
      question: '先介绍一下你目前的生活状态，以及你最想改变的一件事。',
      purpose: '建立你的当前基线与主要目标',
      tags: ['现状', '目标']
    };
  }
  if (answeredCount === 1) {
    return {
      question: '你今天最消耗精力的时刻是什么？它为什么会发生？',
      purpose: '识别高消耗场景',
      tags: ['精力', '触发点']
    };
  }
  if (answeredCount === 2) {
    return {
      question: '你希望未来 30 天形成哪一个最关键的新习惯？',
      purpose: '明确短期行动目标',
      tags: ['习惯', '30天']
    };
  }
  return {
    question: '回顾今天：哪件小事最值得保留到明天？你会如何稳定复现？',
    purpose: '强化正向行为',
    tags: ['复盘', '延续']
  };
};

const buildPrompt = ({ answeredCount, history }) => {
  const historyText = history.length
    ? history.map((x, idx) => `${idx + 1}. 日期:${x.date}\n问题:${x.question}\n回答:${x.answer || '未回答'}`).join('\n\n')
    : '暂无历史';

  return `你是“每日生活指导”应用的 AI 教练。你的任务是每天只问用户一个问题，让用户通过持续回答完成自我改善。\n\n规则：\n1) 每天只输出 1 个问题\n2) 问题要可回答、具体、聚焦，不要空泛\n3) 前3天优先获取基本情况、目标、阻碍\n4) 第4天起基于历史回答做连续追问\n5) 语气温和直接，不鸡汤\n\n当前进度：用户已回答 ${answeredCount} 天。\n最近记录：\n${historyText}\n\n输出 JSON：\n{\n  "question": "不超过60字",\n  "purpose": "一句话说明提问目的，不超过40字",\n  "tags": ["标签1","标签2"]\n}\n只输出 JSON。`;
};

export const ensureTodayQuestion = async () => {
  const today = toDateKey();
  const exists = db.prepare(`
    SELECT id, date, question, purpose, tags_json, created_at
    FROM apps_lifeguide_questions
    WHERE date = ?
    LIMIT 1
  `).get(today);
  if (exists) return exists;

  const answeredCount = db.prepare('SELECT COUNT(*) AS c FROM apps_lifeguide_answers').get().c || 0;
  const history = db.prepare(`
    SELECT q.date, q.question, a.answer
    FROM apps_lifeguide_questions q
    LEFT JOIN apps_lifeguide_answers a ON a.question_id = q.id
    ORDER BY q.date DESC
    LIMIT 7
  `).all();

  let generated = getFallbackQuestion(answeredCount);

  try {
    const resp = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt({ answeredCount, history }) }]
      })
    });
    const data = await resp.json();
    if (resp.ok && data.success !== false) {
      const parsed = parseModelJson(data.message?.content || '');
      generated = {
        question: String(parsed.question || generated.question).trim() || generated.question,
        purpose: String(parsed.purpose || generated.purpose).trim() || generated.purpose,
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(v => String(v || '').trim()).filter(Boolean).slice(0, 4) : generated.tags
      };
    }
  } catch {
    // fallback question is used
  }

  const ret = db.prepare(`
    INSERT INTO apps_lifeguide_questions (date, question, purpose, tags_json, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(today, generated.question, generated.purpose, JSON.stringify(generated.tags || []));

  return db.prepare(`
    SELECT id, date, question, purpose, tags_json, created_at
    FROM apps_lifeguide_questions
    WHERE id = ?
  `).get(ret.lastInsertRowid);
};

export const formatQuestion = (row) => ({
  id: row.id,
  date: row.date,
  question: row.question,
  purpose: row.purpose || '',
  tags: (() => {
    try { return JSON.parse(row.tags_json || '[]'); } catch { return []; }
  })(),
  createdAt: row.created_at
});
