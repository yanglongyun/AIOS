export const optimizeHandler = async (body = {}) => {
  const topicInfo = String(body.topicInfo || '').trim();
  const party = String(body.party || '').trim();
  const name = String(body.name || '').trim();
  const draft = String(body.draft || '').trim();
  if (!draft) return { status: 400, message: 'draft 不能为空' };

  const messages = [{
    role: 'user',
    content: `这是当前辩论信息：${topicInfo}

我是来自${party}的${name}，我的发言草稿是：“${draft}”

请帮我优化这个发言，使其更有说服力和感染力。
风格要求：真实口语化，有语气词，不要官话套话，可加入动作/神态/情绪（放在括号里）。
直接返回优化后的发言内容，不要解释。`
  }];

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
    return { status: 500, message: error.message || '优化失败' };
  }
};
