export const debateHandler = async (body = {}) => {
  const topicInfo = String(body.topicInfo || '').trim();
  if (!topicInfo) return { status: 400, message: '缺少 topicInfo' };

  const tools = [
    {
      type: 'function',
      function: {
        name: 'moderator',
        description: '主持人发言',
        parameters: {
          type: 'object',
          properties: { content: { type: 'string', description: '发言内容' } },
          required: ['content']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'opponent',
        description: '对手候选人发言',
        parameters: {
          type: 'object',
          properties: { content: { type: 'string', description: '发言内容' } },
          required: ['content']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'candidate',
        description: '让用户候选人发言',
        parameters: { type: 'object', properties: {}, required: [] }
      }
    },
    {
      type: 'function',
      function: {
        name: 'next',
        description: '结束当前议题进入下一议题',
        parameters: { type: 'object', properties: {}, required: [] }
      }
    }
  ];

  const messages = [
    {
      role: 'system',
      content: `你在扮演美国总统辩论主持人，且必须通过工具调用响应。
你的任务是把控辩论、收敛话题、尽快进入下一个议题。
不要透露下一个议题内容。
进入下一议题前，主持人先做简短收尾过渡，再调用 next。
如果整体发言超过 8 条，必须尽快调用 next。
对手发言要口语化，有情绪、动作、语气（放在括号里）。`
    },
    {
      role: 'user',
      content: `这是当前辩论信息：${topicInfo}`
    }
  ];

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        tools,
        tool_choice: 'auto',
        parallel_tool_calls: false
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || `LLM request failed: ${res.status}` };
    }

    const message = data.message || {};
    if (!Array.isArray(message.tool_calls) || !message.tool_calls.length) {
      return { status: 500, message: 'AI 未调用工具' };
    }

    const toolCall = message.tool_calls[0];
    const functionName = toolCall.function?.name;
    const args = JSON.parse(toolCall.function?.arguments || '{}');
    const result = { action: functionName };

    if (functionName === 'opponent' || functionName === 'moderator') {
      result.content = String(args.content || '').trim();
    }
    return result;
  } catch (error) {
    return { status: 500, message: error.message || '辩论推进失败' };
  }
};
