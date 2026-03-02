import { db } from '../db.js';

/**
 * AI 生图
 * 根据对话内容生成 prompt，调用图片模型 API 生成图片
 */
export const generateHandler = async (body = {}) => {
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return { status: 400, message: 'prompt 不能为空' };

  // 获取图片模型设置
  const getVal = (key) => {
    const row = db.prepare('SELECT value FROM apps_lovehouse_settings WHERE key = ?').get(key);
    return row?.value || '';
  };

  const imgApiUrl = getVal('img_api_url');
  const imgApiKey = getVal('img_api_key');
  const imgModel = getVal('img_model');

  if (!imgApiUrl || !imgApiKey || !imgModel) {
    return { status: 400, message: '请先在设置中配置图片生成模型' };
  }

  try {
    console.log(`[Lovehouse] Generating image - Model: ${imgModel}`);

    const res = await fetch(imgApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${imgApiKey}`
      },
      body: JSON.stringify({
        model: imgModel,
        prompt,
        size: '1024x1024'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Lovehouse] Image API Error:', res.status, errText);
      return { status: 500, message: `图片生成失败: ${res.status}` };
    }

    const data = await res.json();
    const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;

    if (!imageUrl) {
      return { status: 500, message: '图片生成返回为空' };
    }

    // 存到 photos 表
    const isBase64 = !imageUrl.startsWith('http');
    const r = db.prepare(`
      INSERT INTO apps_lovehouse_photos (prompt, url, type)
      VALUES (?, ?, ?)
    `).run(prompt, imageUrl, isBase64 ? 'base64' : 'url');

    return {
      success: true,
      photo: {
        id: r.lastInsertRowid,
        prompt,
        url: imageUrl,
        type: isBase64 ? 'base64' : 'url'
      }
    };
  } catch (error) {
    console.error('[Lovehouse] Generation failed:', error.message);
    return { status: 500, message: error.message || '图片生成失败' };
  }
};
