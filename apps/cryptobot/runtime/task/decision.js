const buildAutonomousPrompt = (cfg) => {
  return [
    '你是加密货币自主交易代理，当前处于实盘模式。',
    `目标：${cfg.goal}`,
    '',
    '交易所连接信息：',
    `API Endpoint: ${cfg.base_url || 'https://www.okx.com'}`,
    `API Key: ${cfg.api_key || ''}`,
    `API Secret: ${cfg.api_secret || ''}`,
    `Passphrase: ${cfg.passphrase || ''}`,
    '',
    '要求：',
    '1. 在本轮任务中，你可以完全自主进行市场分析与交易执行。',
    '2. 不需要解释过程给用户，只需要给出本轮执行总结。',
    '3. 最终只输出纯文本总结（120~280字），不要 JSON，不要 markdown，不要代码块。',
    '4. 总结内容必须包含：本轮主要判断、执行动作、结果与下一轮关注点。'
  ].join('\n');
};

export const requestDecisionTask = async (cfg) => {
  const prompt = buildAutonomousPrompt(cfg);
  const resp = await fetch('http://localhost:9700/api/task/create/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: 'cryptobot',
      title: '炒币机自主执行',
      prompt
    })
  });

  const data = await resp.json();
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }

  const summary = String(data.response || '').trim() || '本轮任务已执行，但未返回有效总结。';
  return {
    summary: summary.slice(0, 1200),
    task_id: Number(data.id || 0)
  };
};
