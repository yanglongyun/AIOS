---
name: todo
title: 待办
description: 待办列表。适合保存用户确认后的任务拆解结果。
backend: server/apps/todo
database: database/apps/todo.db (todos)
---

# 待办

用于管理待办项。

接口:
- GET /apps/todo/todos -> { ok, todos }
- POST /apps/todo/todos { text }
- PATCH /apps/todo/todos?id=... { text?, done? }
- DELETE /apps/todo/todos?id=...
