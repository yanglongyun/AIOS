# AIOS

AI-Powered Operating System（面向个人的 AI 操作系统）

AIOS 是一个开源原型：
- 一个 AI 驱动的主服务（对话、任务、调度）
- 一个应用服务（应用独立运行，互不拖垮）
- 一套可直接使用的 Web 桌面

## 1 分钟上手

### 自动安装

Linux (Ubuntu/Debian)
```bash
curl -fsSL https://raw.githubusercontent.com/valueriver/aios/main/install-linux.sh | bash
```

macOS
```bash
curl -fsSL https://raw.githubusercontent.com/valueriver/aios/main/install-macos.sh | bash
```

Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/valueriver/aios/main/install-windows.ps1 | iex
```

打开：`http://localhost:9700/aios`

## 手动启动（开发）

前置要求：
- Node.js 22+
- npm 10+

步骤：

1. 进入项目目录
```bash
cd AIOS
```

2. 安装依赖
```bash
npm ci
```

3. 构建前端
```bash
npm run build
```

4. 启动主服务（9700）
```bash
npm start
```

5. 新开一个终端，启动应用服务（9701）
```bash
npm run start:apps
```

6. 浏览器打开
```text
http://localhost:9700/aios
```

## 首次使用

1. 打开页面后完成初始化（注册管理员账号）
2. 在设置中配置模型提供商（API URL、API Key、Model）
3. 回到聊天页开始下达任务

## 常见问题

1. 页面 502 / 应用接口报错
- 通常是 `apps` 服务没启动，确认第 5 步已执行

2. 数据库相关报错（better-sqlite3）
- 检查 Node 版本是否为 22+
- 重新安装依赖：`rm -rf node_modules package-lock.json && npm ci`

3. 端口被占用
- 默认端口：主服务 `9700`，应用服务 `9701`
- 释放占用后重启服务

## 架构概览

- `server/`：主服务（API、对话、任务、调度）
- `apps/`：应用服务与应用模块
- `ui/`：前端界面（Vite + Vue）
- `shared/`：共享工具与认证逻辑
- `database/`：SQLite 数据

## 项目愿景（简版）

AIOS 的核心观点：
- 对话是新的人机交互入口
- GUI 依然不可替代
- AI 与应用应双向调用，而不是彼此割裂

这个仓库是一个可运行、可改造、可扩展的起点。
