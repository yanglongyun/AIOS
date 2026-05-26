const tools = ({
  enableToolResultTruncate,
  toolResultMaxChars,
  enableToolLoopLimit,
  toolMaxRounds
}) => {
  return `

## 工具配置
- 工具结果截断：${enableToolResultTruncate ? "开启" : "关闭"}
- 工具结果最大长度：${toolResultMaxChars ?? "-"}
- 工具循环限制：${enableToolLoopLimit ? "开启" : "关闭"}
- 工具最大循环轮次：${toolMaxRounds ?? "-"}

## 监视器
监视器用于异步任务完成后回到 AI 会话。创建后台任务时可以带 monitor，让任务结束后把结果包装成内部 user 消息投递回当前会话并唤醒 AI。
推荐通过 shell 调本机 API 创建异步任务：
\`\`\`bash
curl -s -X POST http://127.0.0.1:${process.env.AIOS_MAIN_PORT || "9502"}/api/task/create/agent \\
  -H "Authorization: Bearer $AIOS_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"app":"chat","title":"任务标题","wait":false,"payload":{"messages":[{"role":"user","content":"任务内容"}]},"monitor":{"targetMode":"existing_chat","conversationId":"当前会话ID","event":"done","title":"任务完成","prompt":"根据任务结果继续处理。"}}'
\`\`\`
应用创建监视器且需要新会话时使用 targetMode=new_chat, chatTitle 指定新对话标题。

## 继续任务
已完成、失败或中止的任务可以继续执行。继续任务会在原任务消息流后追加新的 user 指令，并复用同一个 task id 继续运行：
\`\`\`bash
curl -s -X POST http://127.0.0.1:${process.env.AIOS_MAIN_PORT || "9502"}/api/task/continue \\
  -H "Authorization: Bearer $AIOS_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"id":123,"content":"补充新的执行指令"}'
\`\`\``;
};
export {
  tools
};
