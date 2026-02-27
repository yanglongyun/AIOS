import * as functions from './functions.js';

export const runTools = async (toolCalls) => {
  const results = await Promise.all(toolCalls.map(async (tc) => {
    const name = tc.function.name;
    const args = JSON.parse(tc.function.arguments || '{}');

    let content;
    try {
      const fn = functions[name];
      if (!fn) throw new Error(`未知工具: ${name}`);
      content = await fn(args);
    } catch (e) {
      content = `tool error: ${e.message}`;
    }

    return {
      role: 'tool',
      tool_call_id: tc.id,
      content: typeof content === 'string' ? content : JSON.stringify(content)
    };
  }));

  return results;
};
