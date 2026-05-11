import { instantTask } from '../../../shared/apps/instantTask.js';

export const optimizeNotebook = async ({ content, prompt, taskTitle, req }) => {
  if (!content?.trim()) return { error: '内容为空', status: 400 };
  const promptText = String(prompt || '').trim();
  if (!promptText) return { error: 'prompt 不能为空', status: 400 };

  const data = await instantTask({
    app: 'notebook',
    title: String(taskTitle || '').trim() || '笔记润色',
    payload: { messages: [{ role: 'user', content: promptText }] },
    req
  });

  const result = (data.response || '').trim();
  if (!result) return { error: '优化结果为空', status: 500 };
  return { result };
};
