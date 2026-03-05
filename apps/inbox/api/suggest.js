import { db } from '../db.js';
import { instantTaskJson } from '../../app_shared/instantTask.js';

export const suggestHandler = async (body = {}, req) => {
  const id = Number(body.id);
  if (!id) return { status: 400, message: '缺少 id' };

  const msg = db.prepare('SELECT id, name, email, content FROM inbox_messages WHERE id = ?').get(id);
  if (!msg) return { status: 404, message: '信件不存在' };

  try {
    const data = await instantTaskJson({
      app: 'inbox',
      title: `回复建议 #${id}`,
      schema: { required: ['suggestion'] },
      prompt: '请为来信生成回复建议，按 schema 输出 JSON。',
      messages: [{
        role: 'system',
        content: `你是用户的私人助理，帮助用户回复收到的来信。根据来信内容，撰写一封得体、友好的回复。
要求：
- 直接输出回复正文，不要加"回复："等前缀
- 语气自然，礼貌得体
- 100-200字左右
- 不要使用 markdown 格式
- 必须输出 JSON：{"suggestion":"..."}`
      }, {
        role: 'user',
        content: `来信人：${msg.name || '匿名'}${msg.email ? ` (${msg.email})` : ''}\n来信内容：\n${msg.content}`
      }],
      req
    });

    const suggestion = String(data.suggestion || '').trim();
    if (!suggestion) return { status: 500, message: '生成结果为空' };

    db.prepare('UPDATE inbox_messages SET reply_suggestion = ? WHERE id = ?').run(suggestion, id);

    return { success: true, suggestion };
  } catch (e) {
    return { status: 500, message: e.message || '生成建议回复失败' };
  }
};
