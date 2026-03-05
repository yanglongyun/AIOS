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

export const createHandler = async (body = {}, req) => {
  const topic = String(body.topic || '').trim();
  if (!topic) return { status: 400, message: '请输入创作主题' };

  try {
    const llm = await callLlmChat(req, {
      response_format: { type: 'json_object' },
      messages: [{
        role: 'system',
        content: `你是小红书爆款文案专家。根据用户主题，生成 4-6 页的小红书图文内容。
必须返回 JSON：
{
  "pages": [
    { "type": "cover", "content": "封面标题文案" },
    { "type": "content", "content": "正文内容，50-120字" },
    { "type": "content", "content": "正文内容" },
    { "type": "summary", "content": "总结页文案" }
  ]
}
要求：
- 第一页必须是 cover（封面），最后一页是 summary（总结）
- 文案要有小红书风格：口语化、有emoji、有吸引力
- 每页内容独立完整，适合单页展示`
      }, {
        role: 'user',
        content: `主题：${topic}`
      }]
    });
    if (!llm.ok) return { status: llm.status, message: llm.message || '生成失败' };
    const data = llm.data;

    const parsed = parseModelJson(data.message?.content || '');
    const pages = parsed.pages || [];
    if (!pages.length) return { status: 500, message: 'AI 未返回页面内容' };

    const ret = db.prepare('INSERT INTO apps_redmill_projects (topic) VALUES (?)').run(topic);
    const projectId = ret.lastInsertRowid;

    const insert = db.prepare('INSERT INTO apps_redmill_pages (project_id, page_index, page_type, content) VALUES (?, ?, ?, ?)');
    pages.forEach((p, i) => {
      insert.run(projectId, i, p.type || 'content', p.content || '');
    });

    const savedPages = db.prepare('SELECT id, page_index AS pageIndex, page_type AS pageType, content FROM apps_redmill_pages WHERE project_id = ? ORDER BY page_index').all(projectId);

    return { success: true, project: { id: projectId, topic, pages: savedPages } };
  } catch (e) {
    return { status: 500, message: e.message || '创建失败' };
  }
};
