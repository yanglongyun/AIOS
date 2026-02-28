export const callLLM = async ({ messages, tools, model, apiUrl, apiKey, signal, responseFormat }) => {
  const body = { model, messages };
  if (tools?.length) body.tools = tools;
  if (responseFormat) body.response_format = responseFormat;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message;
};
