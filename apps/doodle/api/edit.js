import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '../../../../..');
const UPLOAD_DIR = join(ROOT, 'files', 'uploads', 'doodle');

export const editHandler = async (body = {}) => {
  const imagePath = String(body.imagePath || '').trim();
  const prompt = String(body.prompt || '').trim();
  const region = body.region || {};

  if (!imagePath) return { status: 400, message: '缺少图片路径' };
  if (!prompt) return { status: 400, message: '请输入修改指令' };

  let buffer;
  try { buffer = await readFile(imagePath); } catch { return { status: 400, message: '图片不存在' }; }

  const imageBase64 = buffer.toString('base64');
  const regionDesc = region.x != null
    ? `请只修改图片中从左上角 (${Math.round(region.x)}%, ${Math.round(region.y)}%) 到右下角 (${Math.round(region.x + region.w)}%, ${Math.round(region.y + region.h)}%) 的区域。`
    : '';

  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: `你是图片编辑专家。${regionDesc}用户要求：${prompt}\n\n请描述修改后的图片应该是什么样子，给出详细描述。` },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
    ]
  }];

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || '编辑失败' };
    }

    const description = data.message?.content || '';

    await mkdir(UPLOAD_DIR, { recursive: true });
    const editedName = `edited-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`;
    const editedPath = join(UPLOAD_DIR, editedName);
    await writeFile(editedPath, description);

    const ret = db.prepare(`
      INSERT INTO apps_doodle_works (original_path, edited_path, prompt, region)
      VALUES (?, ?, ?, ?)
    `).run(imagePath, editedPath, prompt, JSON.stringify(region));

    return {
      success: true,
      item: {
        id: ret.lastInsertRowid,
        description,
        prompt,
        region
      }
    };
  } catch (e) {
    return { status: 500, message: e.message || '编辑失败' };
  }
};
