import { getSettings } from './get.js';

const resolveModelsEndpoint = (apiUrl) => {
  const url = new URL(apiUrl);

  if (url.hostname === 'openrouter.ai') {
    return 'https://openrouter.ai/api/v1/models/user';
  }

  if (url.pathname.endsWith('/chat/completions')) {
    url.pathname = url.pathname.replace(/\/chat\/completions$/, '/models');
    url.search = '';
    return url.toString();
  }

  if (url.pathname.endsWith('/responses')) {
    url.pathname = url.pathname.replace(/\/responses$/, '/models');
    url.search = '';
    return url.toString();
  }

  if (url.pathname === '/v1') {
    url.pathname = '/v1/models';
    url.search = '';
    return url.toString();
  }

  url.pathname = '/models';
  url.search = '';
  return url.toString();
};

export const listModels = async (body = {}) => {
  const settings = getSettings();
  const apiUrl = String(body.apiUrl || settings.apiUrl || '').trim();
  const apiKey = String(body.apiKey || settings.apiKey || '').trim();

  if (!apiUrl || !apiKey) {
    return { models: [], total: 0 };
  }

  const endpoint = resolveModelsEndpoint(apiUrl);
  const headers = {
    Authorization: `Bearer ${apiKey}`
  };

  if (endpoint.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'aios';
  }

  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Load models failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const rows = Array.isArray(data?.data) ? data.data : [];
  const dedup = new Map();

  for (const row of rows) {
    const id = row?.id;
    if (!id || dedup.has(id)) continue;
    dedup.set(id, {
      id,
      name: row?.name || id,
      description: row?.description || '',
      contextLength: Number(row?.context_length) || 0,
      supportedParameters: Array.isArray(row?.supported_parameters) ? row.supported_parameters : [],
      pricing: row?.pricing || {},
      topProvider: row?.top_provider || {},
      architecture: row?.architecture || {}
    });
  }

  const modelItems = [...dedup.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { models: modelItems.map((m) => m.id), items: modelItems, total: modelItems.length };
};
