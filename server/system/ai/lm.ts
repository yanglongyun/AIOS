// @ts-nocheck
const buildHeaders = (apiKey) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`,
});

const callLm = async (apiUrl, apiKey, payload, { signal } = {}) => {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify({ ...payload, stream: false }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LM ${res.status}: ${text}`);
  }

  const json = await res.json();
  const message = json?.choices?.[0]?.message;
  if (!message) {
    throw new Error("LM response missing choices[0].message");
  }

  return {
    message,
    usage: json?.usage || null,
  };
};

export { callLm };
