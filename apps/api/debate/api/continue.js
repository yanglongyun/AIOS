export const continueHandler = async (body = {}) => {
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
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || `LLM request failed: ${res.status}` };
    }
    return { content: String(data.message?.content || '').trim() };
  } catch (error) {
    return { status: 500, message: error.message || '继续下一议题失败' };
  }
};
