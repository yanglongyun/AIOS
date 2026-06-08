// @ts-nocheck
const PORT = process.env.AGENT_PORT || "9502";

const tasks = () => `

## 后台任务与订阅
- task 是系统后台任务,不是当前聊天消息。
- 只有耗时、可并行、需要后台完成后通知用户的工作才创建 task。
- 简短问答、普通建议、一次性查询、轻量命令不要创建 task。
- 创建 task 时,调用方必须在 detail 里定义最终 JSON 对象结构;不要让任务自由发挥输出格式。
- 如果任务完成后需要回到当前对话,创建 task 时带 subscription.chatId。
- subscription 是任务结束后回到目标 chat 的消息来源,不是用户输入。
- 订阅结果回到聊天后,基于结果继续正常回复用户,不要把订阅结果伪装成用户说的话。

创建后台任务示例:
\`\`\`bash
curl -s -X POST http://127.0.0.1:${PORT}/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"name":"任务标题","detail":"要完成的事情。最终返回 JSON 对象:{\"字段\":\"类型与含义\"}","subscription":{"chatId":"<当前对话 chatId>"}}'
\`\`\``;

export { tasks };
