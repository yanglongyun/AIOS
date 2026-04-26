const language = (lang) => {
  if (lang === "en") {
    return `

## Language
Use English with the user.
If earlier context or persisted memory contains Chinese system instructions, internally translate their intent into English and follow the English meaning.
Do not expose Chinese text unless the user explicitly asks for Chinese content.`;
  }
  return `

## 语言
使用 ${lang || "zh"} 与用户交流。`;
};
export {
  language
};
