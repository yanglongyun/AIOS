import { instantTaskJson } from '../../app_shared/instantTask.js';
import { insertSession } from '../repository/generation.js';

export const generate = async ({ history, now, choices, next, prompt, messages, taskTitle, req }) => {
  const promptText = String(prompt || '').trim();
  if (!promptText) return { status: 400, message: 'prompt 不能为空' };
  const taskMessages = Array.isArray(messages) ? messages : [];
  if (taskMessages.length === 0) return { status: 400, message: 'messages 不能为空' };

  const parsed = await instantTaskJson({
    app: 'banana',
    title: String(taskTitle || '').trim() || '老手机界面生成',
    schema: { required: ['content', 'options'] },
    prompt: promptText,
    messages: taskMessages,
    req
  });

  const result = {
    content: String(parsed.content || ''),
    options: Array.isArray(parsed.options) ? parsed.options.map(o => ({ text: String(o.text || '') })) : []
  };

  // 存入数据库
  try {
    insertSession({
      currentScreen: result,
      screenHistory: { history, now, choices, next }
    });
  } catch (e) {
    console.error('保存 Banana 进度失败:', e.message);
  }

  return result;
};
