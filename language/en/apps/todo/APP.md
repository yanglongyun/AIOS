---
name: todo
title: Todo
description: Todo list with today/later sections, high priority, due dates, embedded subtasks; natural-language add and inline AI decomposition (results written back directly).
backend: server/apps/todo
database: database/apps/todo.db (todos)
---

# Todo

Use this app to manage todo items. Subtasks are embedded as JSON in the todos.subtasks column; there is no separate table.

Adding a todo goes through natural language: the frontend first sends the input to /parse (with a local fallback parser on failure), then POSTs the resulting { text, due, priority, section }.

Inline decomposition: rows that are not done and have no subtasks show a decompose button. Clicking it calls /decompose and the returned subtasks are PATCHed straight back into that todo's subtasks (direct-write pattern, no confirmation step). Checking off all subtasks marks the whole todo done.

API:
- GET /apps/todo/todos -> { ok, todos }
- POST /apps/todo/todos { text, section?, priority?, subtasks?, due? } -> { ok, todo }
- PATCH /apps/todo/todos?id=... { text?, done?, section?, priority?, subtasks?, due? } -> { ok, todo }
- DELETE /apps/todo/todos?id=... -> { ok }
- POST /apps/todo/parse { text } -> { ok, taskId, result: { text, due, priority, section } } (natural-language parsing; understands today/tomorrow/weekday/month-day/important, etc.)
- POST /apps/todo/decompose { text } -> { ok, taskId, subtasks: [{ id, text, done }] } (splits into 3-6 subtasks, id is a UUID)
- POST /apps/todo/plan -> { ok, taskId, picks: [{ id, reason }], note } (suggests up to 3 unfinished "later" items to move to today. Endpoint kept, currently no UI entry)

Fields:
- section: today or later
- priority: high or empty string
- due: YYYY-MM-DD or empty string
- done / doneAt: completion state and time (ISO string)
- subtasks: [{ id, text, done }], id and text required
