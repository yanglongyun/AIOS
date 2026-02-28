export const callLLM = async (provider, apiUrl, apiKey, payload, signal) => {
  const headers = { 'Content-Type': 'application/json' };
  if (provider === 'claude') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (apiUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'aios';
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message;
};
