// @ts-nocheck
const tools = ({
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000,
} = {}) => `

## 工具
你只有一个工具: shell。

- shell(command, summary, timeout?, cwd?): 执行 shell 命令并返回输出。
- summary 必须用一句话概括本次工具调用要做什么,面向用户展示。
- 默认超时 30 秒；安装、构建、测试等耗时任务要显式设置更长 timeout。
- 读文件优先用 rg/sed/head/tail；避免一次输出过多内容。
- 不要使用工具做纯聊天、常识回答或无需本机验证的事情。
- 工具结果截断: ${enableToolResultTruncate ? "开启" : "关闭"}
- 工具结果最大长度: ${toolResultMaxChars}`;

export { tools };
