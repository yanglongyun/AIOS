import { callLlmChat } from '../../app_shared/chatLlm.js';

export const continueHandler = async (body = {}, req) => {
  const prevTopic = String(body.prevTopic || '').trim();
  const newTopic = String(body.newTopic || '').trim();
  const candidateInfo = String(body.candidateInfo || '').trim();
  if (!newTopic) return { status: 400, message: '缺少 newTopic' };

  const messages = [
    {
      role: 'system',
      content: '你扮演美国总统辩论主持人。'
    },
    {
      role: 'user',
      content: `刚结束议题：${prevTopic}
新议题：${newTopic}
候选人信息：${candidateInfo}
请给新议题组织一段非常简短的开场白，不要叙述支持率。`
    }
  ];

  try {
    const llm = await callLlmChat(req, { messages });
    if (!llm.ok) return { status: llm.status, message: llm.message };
    const data = llm.data;
    return { content: String(data.message?.content || '').trim() };
  } catch (error) {
    return { status: 500, message: error.message || '继续下一议题失败' };
  }
};
