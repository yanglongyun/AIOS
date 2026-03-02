import { db } from '../../db.js';

const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search';

const decodeEntities = (str = '') => String(str)
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const pickTag = (text, tag) => {
  const m = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeEntities((m?.[1] || '').trim());
};

const parseRssItems = (xml = '') => {
  const matches = [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return matches.map((m) => {
    const block = m[1] || '';
    return {
      title: pickTag(block, 'title'),
      link: pickTag(block, 'link'),
      pubDate: pickTag(block, 'pubDate'),
      source: pickTag(block, 'source'),
      description: pickTag(block, 'description')
    };
  }).filter((v) => v.title && v.link);
};

const loadRequirement = (body = {}) => {
  if (typeof body.requirement === 'string' && body.requirement.trim()) {
    return body.requirement.trim();
  }

  const row = db.prepare('SELECT requirement FROM apps_briefing_config WHERE id = 1').get();
  return (row?.requirement || '').trim();
};

const extractKeywords = async (requirement) => {
  const resp = await fetch('http://localhost:9700/api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `从以下用户需求中提取 3-8 个适合用于 Google News 搜索的关键词/短语。每个关键词应该是一个独立的搜索查询。

用户需求：${requirement}

返回 JSON：{"keywords": ["关键词1", "关键词2", ...]}`
      }]
    })
  });

  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || 'LLM 提取关键词失败');

  const text = String(data.message?.content || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const parsed = JSON.parse((fenced ? fenced[1] : text).trim());

  if (!Array.isArray(parsed.keywords) || !parsed.keywords.length) {
    throw new Error('未能提取关键词');
  }

  return parsed.keywords.map(k => String(k || '').trim()).filter(Boolean).slice(0, 8);
};

const searchKeywordNews = async (keyword) => {
  const q = encodeURIComponent(keyword);
  const url = `${GOOGLE_NEWS_RSS}?q=${q}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const xml = await resp.text();
  return parseRssItems(xml).slice(0, 8).map((item) => ({ ...item, keyword }));
};

const buildFallbackReport = ({ requirement, items }) => {
  const date = new Date().toLocaleDateString('zh-CN');
  const lines = [`# 专属早报 (${date})`, '', `关注方向：${requirement}`, ''];
  const grouped = new Map();
  for (const item of items) {
    if (!grouped.has(item.keyword)) grouped.set(item.keyword, []);
    grouped.get(item.keyword).push(item);
  }

  for (const [keyword, list] of grouped.entries()) {
    lines.push(`## ${keyword}`);
    for (const n of list.slice(0, 4)) {
      lines.push(`- ${n.title}（${n.source || '未知来源'}）`);
      lines.push(`  ${n.link}`);
    }
    lines.push('');
  }

  return {
    title: `${date} 专属早报`,
    markdown: lines.join('\n')
  };
};

const parseModelJson = (raw = '') => {
  const text = String(raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse((fenced ? fenced[1] : text).trim());
};

const buildPrompt = ({ dateText, requirement, keywords, items }) => {
  const sourceLines = items.map((n, idx) => {
    const date = n.pubDate ? new Date(n.pubDate).toLocaleString('zh-CN') : '未知时间';
    return `${idx + 1}. [${n.keyword}] ${n.title}\n来源: ${n.source || '未知'} | 时间: ${date}\n链接: ${n.link}`;
  }).join('\n\n');

  return `你是一位新闻编辑助手，需要为用户生成"专属每日早报"。

今天日期：${dateText}
用户需求：${requirement}
搜索关键词：${keywords.join('、')}

以下是已搜索到的新闻线索，请基于这些线索组织早报，不能编造来源：
${sourceLines}

输出要求：
1) 返回 JSON 对象，不要额外文本
2) 字段结构：
{
  "title": "字符串",
  "overview": "80-160字总览",
  "sections": [
    {"topic":"主题","summary":"60-120字","highlights":["要点1","要点2","要点3"]}
  ],
  "actions": ["建议1","建议2","建议3"]
}
3) sections 按用户关注方向分组，至少 2 个主题
4) highlights 要尽量体现时间和影响
5) 不要输出 markdown，保持 JSON`;
};

export const generateHandler = async (body = {}) => {
  const requirement = loadRequirement(body);
  if (!requirement) return { status: 400, message: '请先填写关注方向' };

  let keywords;
  try {
    keywords = await extractKeywords(requirement);
  } catch {
    // fallback: 直接把需求当搜索词
    keywords = [requirement];
  }

  const searchResults = await Promise.all(keywords.map((k) => searchKeywordNews(k).catch(() => [])));
  const merged = searchResults.flat();

  const dedup = [];
  const seen = new Set();
  for (const item of merged) {
    if (!item.link || seen.has(item.link)) continue;
    seen.add(item.link);
    dedup.push(item);
    if (dedup.length >= 40) break;
  }

  if (!dedup.length) return { status: 500, message: '未搜索到可用新闻，请稍后重试' };

  const dateText = new Date().toLocaleDateString('zh-CN');

  let title = `${dateText} 专属早报`;
  let markdown = '';

  try {
    const llmResp = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt({ dateText, requirement, keywords, items: dedup }) }]
      })
    });

    const llmData = await llmResp.json();
    if (!llmResp.ok || llmData.success === false) throw new Error(llmData.message || `LLM request failed: ${llmResp.status}`);

    const parsed = parseModelJson(llmData.message?.content || '');
    title = String(parsed.title || title).trim() || title;
    const overview = String(parsed.overview || '').trim();
    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
    const actions = Array.isArray(parsed.actions) ? parsed.actions : [];

    const lines = [`# ${title}`, '', overview, ''];
    for (const sec of sections) {
      const topic = String(sec?.topic || '').trim();
      const summary = String(sec?.summary || '').trim();
      const highlights = Array.isArray(sec?.highlights) ? sec.highlights : [];
      if (!topic) continue;
      lines.push(`## ${topic}`);
      if (summary) lines.push(summary);
      for (const h of highlights.slice(0, 5)) {
        const t = String(h || '').trim();
        if (t) lines.push(`- ${t}`);
      }
      lines.push('');
    }

    if (actions.length) {
      lines.push('## 今日行动建议');
      for (const a of actions.slice(0, 5)) {
        const t = String(a || '').trim();
        if (t) lines.push(`- ${t}`);
      }
      lines.push('');
    }

    lines.push('## 参考新闻来源');
    dedup.slice(0, 20).forEach((n, idx) => {
      lines.push(`${idx + 1}. [${n.keyword}] ${n.title}（${n.source || '未知来源'}）`);
      lines.push(`   ${n.link}`);
    });

    markdown = lines.join('\n');
  } catch {
    const fallback = buildFallbackReport({ requirement, items: dedup });
    title = fallback.title;
    markdown = fallback.markdown;
  }

  const ret = db.prepare(`
    INSERT INTO apps_briefing_reports (title, requirement, content_markdown, sources_json, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(title, requirement, markdown, JSON.stringify(dedup));

  const row = db.prepare(`
    SELECT id, title, requirement, content_markdown, sources_json, created_at
    FROM apps_briefing_reports
    WHERE id = ?
  `).get(ret.lastInsertRowid);

  return {
    success: true,
    report: {
      id: row.id,
      title: row.title,
      requirement: row.requirement,
      content: row.content_markdown,
      sources: JSON.parse(row.sources_json || '[]'),
      createdAt: row.created_at
    }
  };
};
