import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, resolve } from 'path';
import { db } from '../db.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '../../../../..');
const UPLOAD_DIR = join(ROOT, 'uploads', 'treasure');

const parseModelJson = (raw = '') => {
  const text = String(raw || '').trim();
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = fenced ? fenced[1].trim() : text;
  return JSON.parse(payload);
};

export const appraiseHandler = async (body = {}) => {
  const rawPath = String(body.imagePath || '').trim();
  const imagePath = resolve(rawPath);
  if (!imagePath) return { status: 400, message: '缺少 imagePath' };
  if (!imagePath.startsWith(UPLOAD_DIR)) return { status: 400, message: '非法图片路径' };

  let buffer;
  try {
    buffer = await readFile(imagePath);
  } catch {
    return { status: 400, message: '图片不存在或不可读取' };
  }

  const imageBase64 = buffer.toString('base64');

  const messages = [{
    role: 'user',
    content: [
      {
        type: 'text',
        text: `你是专业鉴宝师。请识别图片物品并估值，结果用于用户的个人藏品管理。
必须返回 JSON 对象，字段如下：
name(string, 物品名称)
category(string, 物品类别)
condition(string, 成色/状态)
summary_tag(string, 2-4字总结)
value(number, 人民币估值)
comment(string, 80-180字点评)
要求：只输出 JSON，不要额外文本。`
      },
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
      }
    ]
  }];

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_format: { type: 'json_object' }, messages })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || `LLM request failed: ${res.status}` };
    }

    const parsed = parseModelJson(data.message?.content || '');
    if (!parsed || typeof parsed !== 'object') return { status: 500, message: 'AI 返回格式错误' };

    const name = String(parsed.name || '').trim() || '未识别物品';
    const category = String(parsed.category || '').trim() || '未知';
    const condition = String(parsed.condition || '').trim() || '未知';
    const summaryTag = String(parsed.summary_tag || '').trim() || '待定';
    const valueNum = Number(parsed.value || 0);
    const value = Number.isFinite(valueNum) ? valueNum : 0;
    const comment = String(parsed.comment || '').trim() || '暂无点评';

    const ret = db.prepare(`
      INSERT INTO apps_treasures (image_path, name, category, condition_text, summary_tag, value, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(imagePath, name, category, condition, summaryTag, value, comment);

    const item = db.prepare(`
      SELECT id, name, category, condition_text, summary_tag, value, comment, created_at
      FROM apps_treasures
      WHERE id = ?
    `).get(ret.lastInsertRowid);

    return { success: true, item };
  } catch (error) {
    return { status: 500, message: error.message || '鉴宝失败' };
  }
};
