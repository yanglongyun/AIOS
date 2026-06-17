---
name: app-development
description: AGENT 应用开发指导。说明后端分层、SQLite 规则、Vue UI 放置、任务/记忆/技能边界和本机验证流程。
---

# AGENT 应用开发指导

你在 AGENT 项目里工作。这是一个本机运行的对话应用,核心是 ChatGPT 风格的对话、流式输出、WebSocket、shell 工具、后台任务、记忆和技能。

## 工作目录

shell 默认 cwd 应该是 AGENT 项目根目录:

- 后端入口: `server/index.js`
- 后端 API: `server/api/`
- 后端业务: `server/service/`
- 后端数据库访问: `server/repository/`
- WebSocket: `server/ws/`
- AI 工具与模型调用: `server/ai/`
- 前端入口: `ui/`
- 本地技能: `skills/*/SKILL.md`
- 数据库: `data/agent.db`

## 服务端口

- 本机服务: `http://127.0.0.1:9500`
- 健康检查: `curl http://127.0.0.1:9500/api/health`

## 后端分层

新增能力时按现有结构拆分:

- `server/repository/<domain>/`: 只做 SQLite 查询和行级读写。
- `server/service/<domain>/`: 做输入归一化、业务规则和跨 repository 编排。
- `server/api/<domain>.js`: 只做 HTTP 方法、参数和响应。
- `server/api/index.js`: 注册 API 路由。

不要把明显复杂的能力全写进一个文件。也不要为了很小的能力提前制造空抽象。

## 数据库规则

基础表保持:

- `settings`
- `chats`
- `messages`
- `tasks`
- `subscriptions`
- `memories`

任务聊天记录复用 `chats.app = 'task'` 和 `messages`,不要新增 `task_messages`。普通对话默认 `chats.app = 'chat'`。

## AI 工具规则

当前 AI 工具只有 `shell`。不要随手新增 `create_task`、`memory_search`、`memory_get` 这类 LLM tool。

需要让 AI 使用系统机制时,在系统提示词里告诉它通过 shell 调 HTTP API:

- 创建后台任务: `POST /api/tasks`
- 搜索记忆: `GET /api/memories/search?q=...`
- 读取记忆全文: `GET /api/memories/get?id=...`
- 列出技能: `GET /api/skills`
- 读取技能: `GET /api/skills?id=...`

## 前端规则

前端是 Vue 3,放在 `ui/`:

- 入口: `ui/App.vue`
- API 封装: `ui/lib/api.js`
- 页面组件: `ui/components/`
- 样式: `ui/style.css`

一级入口保持 ChatGPT 式侧边栏。`Tasks`、`Memories`、`Skills` 是同级入口,但它们不是同一个概念。

## 验证流程

改完至少跑:

```sh
npm run check
npm run build
curl http://127.0.0.1:9500/api/health
```

涉及 UI 时打开 `http://127.0.0.1:9500/` 验证页面和交互。
