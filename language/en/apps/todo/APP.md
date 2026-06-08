---
name: todo
title: Todo
description: Todo list.
backend: server/apps/todo
database: database/apps/todo.db (todos)
---

# Todo

Use this app to manage todo items.

API:
- GET /apps/todo/todos -> { ok, todos }
- POST /apps/todo/todos { text }
- PATCH /apps/todo/todos?id=... { text?, done? }
- DELETE /apps/todo/todos?id=...
