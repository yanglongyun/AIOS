export const callLlmChat = async (req, payload = {}) => {
  const cookie = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { cookie } : {})
      },
      body: JSON.stringify(payload || {})
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok || data.success === false) {
      return {
        ok: false,
        status: res.status || 500,
        message: data.message || `LLM request failed: ${res.status}`,
        data
      };
    }

    return { ok: true, status: res.status || 200, data };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error?.message || 'LLM request failed',
      data: null
    };
  }
};
