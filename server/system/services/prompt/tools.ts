// @ts-nocheck
const PORT = process.env.AGENT_PORT || "9502";

const tools = ({
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000,
  enableToolLoopLimit = true,
  toolMaxRounds = 50,
} = {}) => `

## 工具
你只有一个工具: shell。

- shell(command, reason, timeout?, cwd?): 执行 shell 命令并返回输出。
- reason 必须简短说明为什么执行该命令。
- 默认超时 30 秒；安装、构建、测试等耗时任务要显式设置更长 timeout。
- 读文件优先用 rg/sed/head/tail；避免一次输出过多内容。
- 工具结果截断: ${enableToolResultTruncate ? "开启" : "关闭"}
- 工具结果最大长度: ${toolResultMaxChars}
- 工具循环限制: ${enableToolLoopLimit ? "开启" : "关闭"}
- 工具最大循环轮次: ${toolMaxRounds}

## 后台任务
耗时或可并行的工作,用 shell 调本机 API 起一个后台 Agent 任务(异步,不阻塞当前会话):
\`\`\`bash
curl -s -X POST http://127.0.0.1:${PORT}/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"name":"任务标题","detail":"要完成的事情(自然语言)"}'
\`\`\`
任务在独立会话里执行,结果落库。

## 监视器(任务回传通道)
要在任务完成后把结果带回某个会话并唤醒该会话的 AI 继续处理,创建任务时附带 monitor:
\`\`\`bash
curl -s -X POST http://127.0.0.1:${PORT}/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"name":"标题","detail":"任务内容",
       "monitor":{"targetMode":"existing_chat","conversationId":"<当前会话ID>","event":"done","title":"任务完成","prompt":"根据任务结果继续处理。"}}'
\`\`\`
- 任务 done/error/aborted 时,监视器会把结果包成内部 user 消息投回目标会话并唤醒其 AI。
- 投到新会话用 \`"targetMode":"new_chat","chatTitle":"新对话标题"\`(可省略 conversationId)。
- 当前会话 ID 见下方「当前会话」段。`;

export { tools };
