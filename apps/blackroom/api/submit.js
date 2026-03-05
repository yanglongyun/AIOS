import { db } from '../db.js';
import { agentTaskJson } from '../../app_shared/agentTask.js';

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

export const submitHandler = async (body = {}, req) => {
  const complaint = String(body.complaint || '').trim();
  const poopCount = Math.max(0, Number(body.poopCount) || 0);

  if (!complaint && poopCount <= 0) {
    return { status: 400, message: '请至少填写不满内容或点击一个 💩' };
  }

  let agentResponse = '';
  let note = '';
  try {
    const result = await taskAgent({ complaint, poopCount, req });
    agentResponse = result.response;
    note = result.note;
  } catch {}

  const ret = db.prepare(`
    INSERT INTO apps_blackroom_records (complaint, poop_count, agent_response, note, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(complaint, poopCount, agentResponse, note);

  const item = db.prepare(`
    SELECT
      id,
      complaint,
      poop_count AS poopCount,
      agent_response AS agentResponse,
      created_at AS createdAt
    FROM apps_blackroom_records
    WHERE id = ?
    LIMIT 1
  `).get(ret.lastInsertRowid);

  return { success: true, item };
};
