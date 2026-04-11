---
name: tasks
description: 任务中心 - 创建、执行和查看 AI 任务。
backend: server/（api/task.js, repository/task/, task/）
frontend: ui/src/apps/tasks
database: database/aios.db（tasks, messages 表）
---

# 任务中心（tasks）

## 代码分布（尚未完全拆分）
- `server/api/task.js`：HTTP 路由入口
- `server/repository/task/`：任务数据库读写
- `server/task/`：任务执行运行时（create/, execution.js, list.js, detail.js, messages.js, stop.js）
- `ui/src/apps/tasks/`：任务列表、详情

## API
- `GET /api/task?limit=&offset=`：任务列表
- `GET /api/task/detail?id=`：任务详情
- `GET /api/task/messages?id=`：任务消息（根据任务 id 反查 `conversation_id`）
- `POST /api/task/create/instant`：创建即时任务
- `POST /api/task/create/agent`：创建 agent 任务
- `POST /api/task/stop`：停止任务（`id`）

## 数据表
- `tasks`：id, conversation_id, app, title, mode, prompt, schema, meta, response, status, error, created_at, finished_at
- `messages`：任务消息复用 chat 的 messages 表，通过 conversation_id 关联

## 任务模式
- `instant`：立即执行一次，支持直接传 `messages/tools/tool_choice`
- `agent`：按 agent 方式执行，适合多步骤处理和需要工具调用的任务

## 当前边界
- tasks 是系统核心能力，后端直接位于主 `server/` 下，不走 `apps/` 子应用服务。
- 前端当前只有 2 个入口：任务列表、任务详情；详情由窗口系统内部打开。
