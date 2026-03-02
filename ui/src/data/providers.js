export const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
  },
  {
    id: 'claude',
    name: 'Claude',
    apiUrl: 'https://api.anthropic.com/v1/messages',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    apiUrl: 'https://api.x.ai/v1/chat/completions',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/chat/completions',
  },
  {
    id: 'qwen',
    name: 'Qwen (通义千问)',
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  },
  {
    id: 'glm',
    name: 'GLM (智谱)',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4.5',
  },
  {
    id: 'glm-coding',
    name: '智谱 Coding Plan',
    apiUrl: 'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions',
    defaultModel: 'glm-5',
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    apiUrl: 'https://api.minimaxi.com/v1/chat/completions',
  },
  {
    id: 'doubao',
    name: 'Doubao (豆包)',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  },
  {
    id: 'aliyun-coding',
    name: '阿里云 Coding Plan',
    apiUrl: 'https://coding.dashscope.aliyuncs.com/v1/chat/completions',
    defaultModel: 'qwen3-coder-plus',
  },
  {
    id: 'custom',
    name: '自定义',
    apiUrl: '',
  }
];

export const getProvider = (id) => PROVIDERS.find(p => p.id === id);
