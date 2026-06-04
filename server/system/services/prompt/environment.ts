// @ts-nocheck
const environment = (cwd = process.cwd()) => `

## 环境
- 当前工作目录: ${cwd}
- 后端服务: http://127.0.0.1:9502
- 数据库: ${cwd}/database/agent.db`;

export { environment };
