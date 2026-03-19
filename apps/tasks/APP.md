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
- `server/repository/task/`：数据库读写（create, list, detail, messages, schedule, stop）
- `server/task/`：任务执行运行时（create/, execution.js, schedule/, list.js, detail.js, stop.js）

## API
- `GET /api/task?limit=&offset=`：任务列表
- `GET /api/task/detail?id=`：任务详情
- `GET /api/task/messages?taskId=`：任务消息
- `POST /api/task/create`：创建任务（`title`, `prompt`）
- `POST /api/task/stop`：停止任务（`taskId`）
- `GET /api/task/schedules`：定时任务列表
- `POST /api/task/schedule`：创建/更新定时任务

## 数据表
- `tasks`：id, conversation_id, schedule_id, app, title, mode, prompt, schema, meta, response, status, error, created_at, finished_at
- `messages`：任务消息复用 chat 的 messages 表，通过 conversation_id 关联
- `schedules`：id, name, prompt, run_at, cron, enabled, last_run_at, last_task_id, created_at, updated_at
