export const parseJsonObject = (raw = '') => {
  const text = String(raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const matched = source.match(/\{[\s\S]*\}/);
  if (!matched) throw new Error('AI 返回不是 JSON');
  return JSON.parse(matched[0]);
};
