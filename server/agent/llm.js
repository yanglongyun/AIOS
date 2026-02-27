export const callLLM = async ({ messages, tools, model, apiUrl, apiKey }) => {
  const body = { model, messages };
  if (tools?.length) body.tools = tools;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message;
};
