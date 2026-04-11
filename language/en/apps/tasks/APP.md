---
name: tasks
description: Task center for creating, executing, stopping, and reviewing AI tasks.
backend: server/main/api/task.js, server/main/task, server/agent, server/llm, server/prompt
frontend: gui/src/apps/tasks
database: database/aios.db (tasks, messages)
---

# tasks

- Role: core system task app. It does not run under `server/apps/`; it is part of the main server.
- Frontend: `gui/src/apps/tasks`
- Backend: `server/main/api/task.js`, `server/main/task/`, `server/agent/`, `server/llm/`, `server/prompt/`
- Data: `tasks` and `messages` in `database/aios.db`
- Entry points:
  - `GET /api/task`
  - `GET /api/task/detail`
  - `GET /api/task/messages`
  - `POST /api/task/create/instant`
  - `POST /api/task/create/agent`
  - `POST /api/task/stop`
