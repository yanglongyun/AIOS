// @ts-nocheck
const environment = (cwd = process.cwd()) => {
  const port = process.env.AGENT_PORT || "9502";
  return `

## 环境
- 当前工作目录: ${cwd}
- 后端服务: http://127.0.0.1:${port}
- 应用接口: 本机应用统一挂在后端服务的 \`/apps/<id>/*\` 下(如 \`http://127.0.0.1:${port}/apps/todo/todos\`)
- 数据库: ${cwd}/database/system.db`;
};

export { environment };
