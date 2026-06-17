---
name: todo
title: 待办
description: 待办列表。支持今天/以后分区、高优先级标记和智能拆解子任务。
backend: server/apps/todo
database: data/apps/todo.db (todos)
---

# 待办

用于管理待办项。

智能拆解只返回当前待办的子任务草稿,前端会把子任务写回对应待办。

接口:
- GET /apps/todo/todos -> { ok, todos }
- POST /apps/todo/todos { text, section?, priority?, subtasks? }
- PATCH /apps/todo/todos?id=... { text?, done?, section?, priority?, subtasks? }
- DELETE /apps/todo/todos?id=...
- POST /apps/todo/decompose { text } -> { ok, subtasks }

字段:
- section: today 或 later
- priority: high 或空字符串
- subtasks: [{ id, text, done }]
