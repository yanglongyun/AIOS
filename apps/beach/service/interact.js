import { instantTaskJson } from '../../app_shared/instantTask.js';
import { insertLog } from '../repository/interact.js';

export const interact = async ({ action, req }) => {
  const parsed = await instantTaskJson({
    app: 'beach',
    title: '沙滩互动',
    schema: { required: ['response', 'reaction'] },
    prompt: '请根据用户的动作，模拟你在海边沙滩散步时的自然反应。按 schema 输出 JSON。',
    messages: [{
      role: 'system',
      content: `你是一个温柔、俏皮、懂人心的赛博伴侣，你们现在正走在一片明亮的动漫风格的沙滩上（海风拂面，阳光正好）。
用户会对你做一些互动（如：倾听、散步、划船、送椰子、捡贝壳等）。你需要给出一个生动有趣的反应。

注意输出格式（严格格式化为 JSON）：
1. response：这是你的口语回复或心理活动，字数尽量在十至四十个字，语气温和、带些许俏皮的亲近感。
2. reaction：这是一个简短的概括（不超过五个字），例如"开心地笑"、"低头害羞"、"踩踩水花"。

必须返回合法 JSON：
{"response":"...","reaction":"..."}`
    }, {
      role: 'user',
      content: `我的动作：${action}`
    }],
    req
  });

  const record = {
    action,
    aiResponse: String(parsed.response || '').trim(),
    aiReaction: String(parsed.reaction || '').trim()
  };

  const item = insertLog(record);
  return { success: true, item };
};
