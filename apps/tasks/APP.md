---
name: tasks
description: 任务中心 - 创建、执行、调度 AI 任务，支持定时和重复执行。
backend: server/（api/task.js, repository/task/, task/）
frontend: ui/src/apps/tasks
database: database/aios.db（tasks, messages, schedules 表）
---

# 任务中心（tasks）

## 代码分布（尚未完全拆分）
- `server/api/task.js`：HTTP 路由入口
- `server/repository/task/`：任务和定时任务数据库读写
- `server/task/`：任务执行运行时（create/, execution.js, schedule/, list.js, detail.js, messages.js, stop.js）
- `ui/src/apps/tasks/`：任务列表、详情、创建页

## API
- `GET /api/task?limit=&offset=`：任务列表
- `GET /api/task/detail?id=`：任务详情
- `GET /api/task/messages?id=`：任务消息（根据任务 id 反查 `conversation_id`）
- `POST /api/task/create/instant`：创建即时任务
- `POST /api/task/create/agent`：创建 agent 任务
- `POST /api/task/stop`：停止任务（`id`）
- `GET /api/task/schedule?limit=`：定时任务列表
- `POST /api/task/schedule/create`：创建定时任务
- `POST /api/task/schedule/update`：更新定时任务
- `POST /api/task/schedule/delete`：删除定时任务

## 数据表
- `tasks`：id, conversation_id, schedule_id, app, title, mode, prompt, schema, meta, response, status, error, created_at, finished_at
- `messages`：任务消息复用 chat 的 messages 表，通过 conversation_id 关联
- `schedules`：id, name, prompt, run_at, cron, enabled, last_run_at, last_task_id, created_at, updated_at

## 任务模式
- `instant`：立即执行一次，支持直接传 `messages/tools/tool_choice`
- `agent`：按 agent 方式执行，适合持续型或更复杂的任务编排

## 当前边界
- tasks 是系统核心能力，后端直接位于主 `server/` 下，不走 `apps/` 子应用服务。
- 前端有 3 个入口：任务列表、任务详情、任务创建；其中详情和创建是隐藏 app，由窗口系统内部打开。
