import { instantTask } from '../../app_shared/instantTask.js';

export const optimizeNotebook = async ({ content, req }) => {
  if (!content?.trim()) return { error: '内容为空', status: 400 };

  const prompt = `你是一位文字润色专家。请润色以下文字，使其更加通顺、专业，同时保持原意不变。直接输出润色后的结果，不要添加任何解释或前缀。

原文：
${content}`;

  const data = await instantTask({
    app: 'notebook',
    title: '笔记润色',
    prompt,
    req
  });

  const result = (data.response || '').trim();
  if (!result) return { error: '优化结果为空', status: 500 };
  return { result };
};
