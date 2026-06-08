// @ts-nocheck
const environment = (cwd = process.cwd()) => {
  const port = process.env.AGENT_PORT || "9502";
  const appUrl = `http://127.0.0.1:${port}/apps/todo/todos`;
  const appsLine = "应用接口: 本机应用统一挂在后端服务的 `/apps/<id>/*` 下(如 `{url}`)".replace("{url}", appUrl);
  return `

## 环境
- 当前工作目录: ${cwd}
- 后端服务: http://127.0.0.1:${port}
- ${appsLine}
- 数据库: ${cwd}/database/system.db`;
};

export { environment };
