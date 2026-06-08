// @ts-nocheck
const tools = [
  {
    type: "function",
    function: {
      name: "shell",
      description: "执行 shell 命令，可以运行任意 shell 命令并返回输出结果。",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "要执行的 shell 命令。",
          },
          summary: {
            type: "string",
            description: "本次工具调用的一句话摘要，面向用户展示。",
          },
          timeout: {
            type: "number",
            description:
              "超时时间（秒），默认 30。服务端会裁剪到 [1, 300] 范围。",
          },
          cwd: {
            type: "string",
            description: "可选工作目录，默认使用当前进程工作目录。",
          },
        },
        required: ["command", "summary"],
      },
    },
  },
];

export { tools };
