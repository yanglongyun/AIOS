import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');

export const buildLlmHeaders = (provider, apiUrl, apiKey) => {
  const headers = { 'Content-Type': 'application/json' };
  if (provider === 'claude') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (apiUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'aios';
  }
  return headers;
};

export const writeLlmErrorLog = ({ provider, apiUrl, payload, error, status = null, responseText = '' }) => {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const file = join(LOG_DIR, `llm-error-${ts}.json`);
    const body = {
      time: new Date().toISOString(),
      provider,
      apiUrl,
      status,
      error: String(error?.message || error || 'Unknown LLM error'),
      responseText,
      payload
    };
    writeFileSync(file, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
  } catch {}
};
