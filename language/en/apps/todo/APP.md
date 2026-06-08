---
name: todo
title: Todo
description: Todo list with today/later sections, high priority, and AI subtask decomposition.
backend: server/apps/todo
database: database/apps/todo.db (todos)
---

# Todo

Use this app to manage todo items.

AI decomposition returns draft subtasks for the selected todo. The frontend writes those subtasks back to that todo.

API:
- GET /apps/todo/todos -> { ok, todos }
- POST /apps/todo/todos { text, section?, priority?, subtasks? }
- PATCH /apps/todo/todos?id=... { text?, done?, section?, priority?, subtasks? }
- DELETE /apps/todo/todos?id=...
- POST /apps/todo/decompose { text } -> { ok, subtasks }

Fields:
- section: today or later
- priority: high or empty string
- subtasks: [{ id, text, done }]
