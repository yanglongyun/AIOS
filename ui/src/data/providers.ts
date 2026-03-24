export const PROVIDER_GROUPS = [
  { id: 'default', name: '默认' },
  { id: 'aggregator', name: '聚合平台' },
  { id: 'coding', name: 'Coding Plan' },
  { id: 'custom', name: '自定义' }
];

export const PROVIDERS = [
  // 默认
  {
    id: 'openai',
    name: 'OpenAI',
    group: 'default',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-5.4',
  },
  {
    id: 'claude',
    name: 'Claude',
    group: 'default',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-6',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    group: 'default',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-3-flash-preview',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    group: 'default',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    defaultModel: 'mistral-large-latest',
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    group: 'default',
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-4-1-fast-reasoning',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    group: 'default',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
  },
  {
    id: 'qwen',
    name: 'Qwen (通义千问)',
    group: 'default',
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen3.5-plus',
  },
  {
    id: 'glm',
    name: 'GLM (智谱)',
    group: 'default',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-5',
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    group: 'default',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'kimi-k2.5',
  },
  {
    id: 'stepfun',
    name: 'StepFun (阶跃星辰)',
    group: 'default',
    apiUrl: 'https://api.stepfun.com/v1/chat/completions',
    defaultModel: 'step-3.5-flash',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    group: 'default',
    apiUrl: 'https://api.minimaxi.com/v1/chat/completions',
    defaultModel: 'MiniMax-M2.5',
  },
  {
    id: 'doubao',
    name: 'Doubao (豆包)',
    group: 'default',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    defaultModel: 'doubao-seed-2-0-pro-260215',
  },
  // 聚合平台
  {
    id: 'openrouter',
    name: 'OpenRouter',
    group: 'aggregator',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'google/gemini-3-flash-preview',
  },
  {
    id: 'together',
    name: 'Together AI',
    group: 'aggregator',
    apiUrl: 'https://api.together.xyz/v1/chat/completions',
    defaultModel: 'moonshotai/Kimi-K2.5',
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    group: 'aggregator',
    apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    defaultModel: 'glm-5',
  },
  {
    id: 'chatnext',
    name: 'ChatNext',
    group: 'aggregator',
    apiUrl: 'https://api.chatnext.ai/v1/chat/completions',
    defaultModel: 'gpt-5-mini',
  },
  // Coding Plan
  {
    id: 'glm-coding',
    name: '智谱 Coding Plan',
    group: 'coding',
    apiUrl: 'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions',
    defaultModel: 'glm-5',
  },
  {
    id: 'aliyun-coding',
    name: '阿里云 Coding Plan',
    group: 'coding',
    apiUrl: 'https://coding.dashscope.aliyuncs.com/v1/chat/completions',
    defaultModel: 'qwen3-coder-plus',
  },
  {
    id: 'ark-coding',
    name: '火山引擎 Coding Plan',
    group: 'coding',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions',
    defaultModel: 'doubao-seed-2.0-pro',
  },
  {
    id: 'tencent-coding',
    name: '腾讯云 Coding Plan',
    group: 'coding',
    apiUrl: 'https://api.lkeap.cloud.tencent.com/coding/v3/chat/completions',
    defaultModel: 'minimax-m2.5',
  },
  {
    id: 'kimi-coding',
    name: 'Kimi Coding Plan',
    group: 'coding',
    apiUrl: 'https://api.kimi.com/coding/v1/chat/completions',
    defaultModel: 'kimi-for-coding',
  },
  // 自定义
  {
    id: 'custom',
    name: '自定义',
    group: 'custom',
    apiUrl: '',
    defaultModel: '',
  }
];

export const getProvider = (id) => PROVIDERS.find(p => p.id === id);

export const getProvidersByGroup = (groupId) => PROVIDERS.filter(p => p.group === groupId);
