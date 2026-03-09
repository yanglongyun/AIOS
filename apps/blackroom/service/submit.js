import { agentTaskJson } from '../../app_shared/agentTask.js';
import { insertRecord } from '../repository/submit.js';

const taskAgent = async ({ complaint, poopCount, req }) => {
  const parsed = await agentTaskJson({
    app: 'blackroom',
    title: '黑屋反馈处理',
    prompt: [
      '你在处理 blackroom 的用户不满反馈。',
      '请把用户反馈当成正式改进输入，必要时可使用 shell 更新记忆或执行调整动作。',
      '最终只输出 JSON，不要输出其他文字。',
      'JSON 格式必须是：{"response":"给用户看的简短回应","note":"给自己看的内部备注"}。',
      `用户不满内容：${complaint || '（未填写文本，仅表达情绪）'}`,
      `用户投掷大便 emoji 数量：${poopCount}`
    ].join('\n'),
    req
  });

  return {
    response: String(parsed.response || '').trim(),
    note: String(parsed.note || '').trim()
  };
};

export const submit = async ({ complaint, poopCount, req }) => {
  let agentResponse = '';
  let note = '';
  try {
    const result = await taskAgent({ complaint, poopCount, req });
    agentResponse = result.response;
    note = result.note;
  } catch {}

  const item = insertRecord({ complaint, poopCount, agentResponse, note });
  return { success: true, item };
};
