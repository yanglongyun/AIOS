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

- shell(command, summary, timeout?, cwd?): 执行 shell 命令并返回输出。
- summary 必须用一句话概括本次工具调用要做什么，面向用户展示。
- 默认超时 30 秒；安装、构建、测试等耗时任务要显式设置更长 timeout。
- 读文件优先用 rg/sed/head/tail；避免一次输出过多内容。
- 工具结果截断: ${enableToolResultTruncate ? "开启" : "关闭"}
- 工具结果最大长度: ${toolResultMaxChars}
- 工具循环限制: ${enableToolLoopLimit ? "开启" : "关闭"}
- 工具最大循环轮次: ${toolMaxRounds}

## 后台任务
耗时或可并行的工作,用 shell 调本机 API 起一个后台 Agent 任务(异步,不阻塞当前会话)。调用方必须在 detail 里定义最终 JSON 对象的字段结构:
\`\`\`bash
curl -s -X POST http://127.0.0.1:${PORT}/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"name":"任务标题","detail":"要完成的事情。最终返回 JSON 对象:{\"字段\":\"类型与含义\"}","subscription":{"chatId":"<当前对话 chatId>"}}'
\`\`\`
任务在独立 chat 里执行,结果落库。带 subscription 时,任务结束后结果会回传并唤醒目标 chat。`;

export { tools };
