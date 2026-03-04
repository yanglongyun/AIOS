import { buildLlmHeaders, writeLlmErrorLog } from './common.js';

export const callLlmRegular = async (provider, apiUrl, apiKey, payload, signal) => {
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: buildLlmHeaders(provider, apiUrl, apiKey),
      body: JSON.stringify(payload),
      signal
    });

    if (!res.ok) {
      const text = await res.text();
      writeLlmErrorLog({
        provider,
        apiUrl,
        payload,
        status: res.status,
        responseText: text,
        error: new Error(`LLM ${res.status}: ${text}`)
      });
      throw new Error(`LLM ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message || { role: 'assistant', content: '' };
  } catch (error) {
    writeLlmErrorLog({ provider, apiUrl, payload, error });
    throw error;
  }
};
