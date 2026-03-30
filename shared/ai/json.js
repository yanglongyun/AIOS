const parseJsonObject = (raw = "") => {
  const text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const matched = source.match(/\{[\s\S]*\}/);
  if (!matched) throw new Error("AI \u8FD4\u56DE\u4E0D\u662F JSON");
  return JSON.parse(matched[0]);
};
const validateBySchema = (value, schema) => {
  if (!schema || typeof schema !== "object") return true;
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (!(key in value)) {
      throw new Error(`\u7ED3\u6784\u5316\u7ED3\u679C\u7F3A\u5C11\u5B57\u6BB5: ${key}`);
    }
  }
  return true;
};
export {
  parseJsonObject,
  validateBySchema
};
